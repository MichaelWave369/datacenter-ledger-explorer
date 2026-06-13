export {};

const V38_RELEASE_VERSION = "3.8.0";
const V38_LEGACY_VERSIONS = ["3.7.0", "V3.7.0"];

function syncV38VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V38_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V38_RELEASE_VERSION}` : V38_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V38_RELEASE_VERSION;
}

requestAnimationFrame(syncV38VisibleVersionOnce);
setTimeout(syncV38VisibleVersionOnce, 250);
setTimeout(syncV38VisibleVersionOnce, 1000);
setTimeout(syncV38VisibleVersionOnce, 2000);
