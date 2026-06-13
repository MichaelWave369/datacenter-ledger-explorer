export {};

const V39_RELEASE_VERSION = "3.9.0";
const V39_LEGACY_VERSIONS = ["3.8.0", "V3.8.0"];

function syncV39VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V39_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V39_RELEASE_VERSION}` : V39_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V39_RELEASE_VERSION;
}

requestAnimationFrame(syncV39VisibleVersionOnce);
setTimeout(syncV39VisibleVersionOnce, 250);
setTimeout(syncV39VisibleVersionOnce, 1000);
setTimeout(syncV39VisibleVersionOnce, 2000);
