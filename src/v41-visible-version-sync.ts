export {};

const V41_RELEASE_VERSION = "4.1.0";
const V41_LEGACY_VERSIONS = ["4.0.0", "V4.0.0"];

function syncV41VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V41_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V41_RELEASE_VERSION}` : V41_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V41_RELEASE_VERSION;
}

requestAnimationFrame(syncV41VisibleVersionOnce);
setTimeout(syncV41VisibleVersionOnce, 250);
setTimeout(syncV41VisibleVersionOnce, 1000);
setTimeout(syncV41VisibleVersionOnce, 2000);
setTimeout(syncV41VisibleVersionOnce, 3000);
setTimeout(syncV41VisibleVersionOnce, 5000);
