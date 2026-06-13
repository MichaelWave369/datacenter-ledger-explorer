const RELEASE_VERSION = "2.8.0";
const LEGACY_VERSION = "2.7.0";

function syncVisibleVersion() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    if (node.nodeValue?.includes(LEGACY_VERSION)) {
      node.nodeValue = node.nodeValue.replaceAll(LEGACY_VERSION, RELEASE_VERSION);
    }
    if (node.nodeValue?.includes("V2.7.0")) {
      node.nodeValue = node.nodeValue.replaceAll("V2.7.0", "V2.8.0");
    }
    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = RELEASE_VERSION;
}

function startVersionSync() {
  syncVisibleVersion();
  requestAnimationFrame(syncVisibleVersion);
  setTimeout(syncVisibleVersion, 250);
  setTimeout(syncVisibleVersion, 1000);

  const observer = new MutationObserver(() => syncVisibleVersion());
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startVersionSync, { once: true });
} else {
  startVersionSync();
}
