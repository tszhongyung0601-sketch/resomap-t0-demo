import { useSyncExternalStore } from "react";

/**
 * What the traveller has kept.
 *
 * Two collections, not one: a place and a guide are different things to come
 * back to — one is somewhere you might go, the other is something you might
 * listen to — and the 收藏 screen shows them under separate headings because
 * merging them would make both lists harder to scan.
 *
 * Module scope plus `useSyncExternalStore`, the same shape as the receipts store
 * in Expenses.tsx and for the same reason: the heart on a POI page, the heart in
 * the story player and the 收藏 screen are three different components that must
 * never disagree about what is saved. Component state gives you a filled heart
 * on one screen and an empty list on the next.
 *
 * Persisted to localStorage, because a heart that forgets on reload is not a
 * save — it is a toggle that lies about what it does.
 */

const KEY = "resomap_saved";

interface Saved {
  pois: string[];
  stories: string[];
}

const EMPTY: Saved = { pois: [], stories: [] };

function read(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    return {
      pois: Array.isArray(parsed.pois) ? parsed.pois.filter((x) => typeof x === "string") : [],
      stories: Array.isArray(parsed.stories) ? parsed.stories.filter((x) => typeof x === "string") : [],
    };
  } catch {
    /* Corrupt or unavailable storage. An empty shelf is a survivable answer;
       throwing here would take the whole screen down over a saved list. */
    return EMPTY;
  }
}

let state: Saved = read();
const watchers = new Set<() => void>();

function commit(next: Saved) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Out of quota or private mode. The session still works; only the
       remembering is lost, and that is better than losing the tap. */
  }
  for (const fn of watchers) fn();
}

function subscribe(fn: () => void) {
  watchers.add(fn);
  return () => {
    watchers.delete(fn);
  };
}

/* The snapshot is the module object itself. Returning a fresh one would hand
   React a new reference every call and re-render forever. */
const snapshot = () => state;

export function useSaved(): Saved {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export const togglePoi = (id: string) => commit({ ...state, pois: toggle(state.pois, id) });
export const toggleStory = (id: string) => commit({ ...state, stories: toggle(state.stories, id) });

export const isPoiSaved = (id: string) => state.pois.includes(id);
export const isStorySaved = (id: string) => state.stories.includes(id);

/** The demo reset clears these too — see App.tsx's reset(). */
export const resetSaved = () => commit(EMPTY);
