export function syncMainBounds() {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  const root = document.documentElement;

  if (header) {
    root.style.setProperty("--header-h", `${header.offsetHeight}px`);
  }
  if (footer) {
    root.style.setProperty("--footer-h", `${footer.offsetHeight}px`);
  }
}
