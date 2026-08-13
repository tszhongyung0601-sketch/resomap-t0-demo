import { createContext, useContext } from "react";

/**
 * Where a modal is allowed to render.
 *
 * The shell clips the screen area and stacks the tab bar beside it, so a sheet
 * rendered inside a screen is both cut off at the bottom edge and unable to
 * cover the four tabs — the nav stays lit and tappable behind the scrim, which
 * is the one thing a modal exists to prevent. AppShell publishes a node that
 * sits above both, and `Sheet` portals into it.
 *
 * It is a context rather than a `document.getElementById` because the shell
 * renders twice over in the demo (framed and unframed) and a global id would
 * make the second one silently steal the first one's sheets.
 */
export const OverlayHost = createContext<HTMLElement | null>(null);

export const useOverlayHost = () => useContext(OverlayHost);
