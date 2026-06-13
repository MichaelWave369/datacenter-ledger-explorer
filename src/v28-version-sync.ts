const RELEASE_VERSION = "2.9.0";
const LEGACY_VERSIONS = ["2.7.0", "2.8.0"];

function replaceEvery(value: string, searchValue: string, replacement: string) {
  return value.split(searchValue).join(replacement);
}

function syncVisibleVersion() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    LEGACY_VERSIONS.forEach((legacyVersion) => {
      if (node.nodeValue?.includes(legacyVersion)) {
        node.nodeValue = replaceEvery(node.nodeValue, legacyVersion, RELEASE_VERSION);
      }
      const legacyUpper = `V${legacyVersion}`;
      const releaseUpper = `V${RELEASE_VERSION}`;
      if (node.nodeValue?.includes(legacyUpper)) {
        node.nodeValue = replaceEvery(node.nodeValue, legacyUpper, releaseUpper);
      }
    });
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
