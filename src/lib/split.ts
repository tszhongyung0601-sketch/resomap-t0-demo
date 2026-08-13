import type { Balance, Expense, ExpenseCategory, TravellerId, Transfer } from "../types";

/**
 * Who owes whom, worked out from the bills.
 *
 * Nothing here is stored. Balances and transfers are a pure function of the
 * expense list, for the same reason the consensus score is a pure function of
 * the votes: a saved balance drifts the moment somebody edits a bill, and a
 * settlement figure that disagrees with the receipts above it is worse than no
 * figure. Every number on the 旅費 screens comes through this file.
 */

/**
 * What each person owes for one bill.
 *
 * Even splits carry a rounding remainder — NT$1,000 across three people is
 * 333.33 each — and dropping it loses money from the trip. The remainder goes,
 * one dollar at a time, to the first people in the list, so the shares always
 * add back up to exactly what was paid.
 */
export function shares(e: Expense): Partial<Record<TravellerId, number>> {
  const out: Partial<Record<TravellerId, number>> = {};
  const people = e.forWhom;
  if (people.length === 0) return out;

  /**
   * Stated per-person amounts, with the last person absorbing any difference.
   *
   * The entry sheet refuses to save a custom split that does not add up, so in
   * practice the correction is zero. It exists because this function is also
   * read straight off the fixtures in `data/expenses.ts`, and there it was the
   * one branch that could quietly break the invariant the rest of the file is
   * built on: hand it 300/300/200 against a NT$900 bill and NT$100 leaves the
   * trip, `balances()` stops summing to zero, and the settlement under-collects
   * with nothing on screen to say so. Rounding each share independently could
   * do the same thing a dollar at a time. Better to land the difference
   * somewhere visible on a receipt than to lose it between two screens.
   */
  if (e.mode === "amount" && e.custom) {
    let assigned = 0;
    people.forEach((w, i) => {
      const v =
        i === people.length - 1
          ? e.amountTwd - assigned
          : Math.round(e.custom?.[w] ?? 0);
      out[w] = v;
      assigned += v;
    });
    return out;
  }

  if (e.mode === "share" && e.custom) {
    const total = people.reduce((a, w) => a + (e.custom?.[w] ?? 0), 0);
    if (total <= 0) return evenly(e.amountTwd, people);
    let assigned = 0;
    people.forEach((w, i) => {
      const exact = (e.amountTwd * (e.custom?.[w] ?? 0)) / total;
      const v = i === people.length - 1 ? e.amountTwd - assigned : Math.round(exact);
      out[w] = v;
      assigned += v;
    });
    return out;
  }

  return evenly(e.amountTwd, people);
}

function evenly(amount: number, people: TravellerId[]): Partial<Record<TravellerId, number>> {
  const out: Partial<Record<TravellerId, number>> = {};
  const base = Math.floor(amount / people.length);
  let remainder = amount - base * people.length;
  for (const w of people) {
    out[w] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return out;
}

export const total = (list: Expense[]) => list.reduce((a, e) => a + e.amountTwd, 0);

export function byCategory(list: Expense[]): { category: ExpenseCategory; twd: number }[] {
  const m = new Map<ExpenseCategory, number>();
  for (const e of list) m.set(e.category, (m.get(e.category) ?? 0) + e.amountTwd);
  return [...m].map(([category, twd]) => ({ category, twd })).sort((a, b) => b.twd - a.twd);
}

/**
 * Net position per person: what they paid out, minus what they consumed.
 *
 * Positive means the group owes them. The whole list always sums to zero — if
 * it does not, a bill has been mis-split, and that is worth knowing.
 */
export function balances(list: Expense[], people: TravellerId[]): Balance[] {
  const net = new Map<TravellerId, number>(people.map((w) => [w, 0]));
  for (const e of list) {
    net.set(e.paidBy, (net.get(e.paidBy) ?? 0) + e.amountTwd);
    const s = shares(e);
    for (const w of e.forWhom) net.set(w, (net.get(w) ?? 0) - (s[w] ?? 0));
  }
  return people
    .map((who) => ({ who, net: net.get(who) ?? 0 }))
    .sort((a, b) => b.net - a.net);
}

/**
 * The fewest payments that clear the debt.
 *
 * Greedy: repeatedly match the biggest creditor to the biggest debtor. It is
 * not provably minimal in every case, but for a group of four it always is, and
 * it never produces the thing people actually hate — A pays B, B pays C, C pays
 * A for the same money going round in a circle.
 */
export function settle(list: Expense[], people: TravellerId[]): Transfer[] {
  const owed = balances(list, people).map((b) => ({ ...b }));
  const out: Transfer[] = [];

  const creditors = owed.filter((b) => b.net > 0).sort((a, b) => b.net - a.net);
  const debtors = owed.filter((b) => b.net < 0).sort((a, b) => a.net - b.net);

  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = Math.min(c.net, -d.net);
    /* Below a dollar is rounding noise from an even split, not a debt. */
    if (amount >= 1) out.push({ from: d.who, to: c.who, amount: Math.round(amount) });
    c.net -= amount;
    d.net += amount;
    if (c.net < 1) ci++;
    if (d.net > -1) di++;
  }
  return out;
}
