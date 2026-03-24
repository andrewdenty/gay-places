/**
 * Shared map marker and popup utilities.
 * Update here to change styling across all maps globally.
 */

export const DOT_SIZE = "14px";
export const DOT_SIZE_HIGHLIGHTED = "20px";

const ARROW_UP_RIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>`;

export function createDotMarker(label?: string, isHighlighted = false): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.style.width = isHighlighted ? DOT_SIZE_HIGHLIGHTED : DOT_SIZE;
  el.style.height = isHighlighted ? DOT_SIZE_HIGHLIGHTED : DOT_SIZE;
  el.style.borderRadius = "50%";
  el.style.background = "#171717";
  el.style.border = `2px solid ${isHighlighted ? "#171717" : "#fff"}`;
  el.style.boxShadow = isHighlighted
    ? "0 0 0 4px rgba(23,23,23,0.15), 0 1px 4px rgba(0,0,0,0.3)"
    : "0 1px 4px rgba(0,0,0,0.3)";
  el.style.cursor = "pointer";
  el.style.padding = "0";
  el.style.transition = "width 0.15s, height 0.15s, box-shadow 0.15s";
  if (label) el.setAttribute("aria-label", label);
  return el;
}

export function createClusterMarker(count: number): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.style.width = "32px";
  el.style.height = "32px";
  el.style.borderRadius = "50%";
  el.style.background = "#171717";
  el.style.color = "#fff";
  el.style.border = "2px solid rgba(255,255,255,0.8)";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
  el.style.cursor = "pointer";
  el.style.padding = "0";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.fontSize = "11px";
  el.style.fontWeight = "600";
  el.style.fontFamily = "inherit";
  el.style.letterSpacing = "0";
  el.textContent = String(count);
  el.setAttribute("aria-label", `${count} places`);
  return el;
}

/**
 * @param name        Venue name
 * @param href        Link URL
 * @param extra       Optional HTML inserted between name and button (e.g. distance)
 * @param linkText    Button label (default: "View place")
 * @param linkTarget  Anchor target attribute (default: "_self")
 */
export function buildPopupHtml(
  name: string,
  href: string,
  extra?: string,
  linkText = "View place",
  linkTarget = "_self",
): string {
  return `
    <div style="padding:12px;font-family:inherit;min-width:160px">
      <div style="font-size:13px;font-weight:600;color:#171717;letter-spacing:-0.1px;margin-bottom:${extra ? "4px" : "8px"}">${name}</div>
      ${extra ?? ""}
      <a href="${href}" target="${linkTarget}" rel="noopener noreferrer" style="display:flex;width:100%;align-items:center;justify-content:center;gap:4px;margin-top:8px;padding:6px 10px;border-radius:60px;border:1px solid #e4e4e1;background:transparent;color:#171717;font-size:12px;font-weight:400;line-height:1.4;white-space:nowrap;text-decoration:none;cursor:pointer;box-sizing:border-box;outline:none" onmouseover="this.style.background='#f0f0ed'" onmouseout="this.style.background='transparent'">${linkText} ${ARROW_UP_RIGHT_SVG}</a>
    </div>
  `;
}
