export {};

const V52_RELEASE_VERSION = "5.2.0";
const V52_LEGACY_VERSIONS = ["5.1.0", "V5.1.0"];

function syncV52VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V52_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V52_RELEASE_VERSION}` : V52_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V52_RELEASE_VERSION;
}

requestAnimationFrame(syncV52VisibleVersionOnce);
setTimeout(syncV52VisibleVersionOnce, 250);
setTimeout(syncV52VisibleVersionOnce, 1000);
setTimeout(syncV52VisibleVersionOnce, 2000);
setTimeout(syncV52VisibleVersionOnce, 3000);
setTimeout(syncV52VisibleVersionOnce, 5000);
setTimeout(syncV52VisibleVersionOnce, 7000);
setTimeout(syncV52VisibleVersionOnce, 9000);
