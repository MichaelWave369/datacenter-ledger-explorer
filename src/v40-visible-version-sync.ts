export {};

const V40_RELEASE_VERSION = "4.0.0";
const V40_LEGACY_VERSIONS = ["3.9.0", "V3.9.0"];

function syncV40VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V40_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V40_RELEASE_VERSION}` : V40_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V40_RELEASE_VERSION;
}

requestAnimationFrame(syncV40VisibleVersionOnce);
setTimeout(syncV40VisibleVersionOnce, 250);
setTimeout(syncV40VisibleVersionOnce, 1000);
setTimeout(syncV40VisibleVersionOnce, 2000);
