const RELEASE_VERSION = "3.4.0";
const LEGACY_VERSIONS = ["2.7.0", "2.8.0", "2.9.0", "3.0.0", "3.1.0", "3.2.0", "3.3.0"];

function replaceEvery(value: string, searchValue: string, replacement: string) {
  return value.split(searchValue).join(replacement);
}

function syncVisibleVersion() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of LEGACY_VERSIONS) {
      nextValue = replaceEvery(nextValue, legacyVersion, RELEASE_VERSION);
      nextValue = replaceEvery(nextValue, `V${legacyVersion}`, `V${RELEASE_VERSION}`);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
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
