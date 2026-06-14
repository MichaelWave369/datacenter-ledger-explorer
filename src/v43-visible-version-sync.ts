export {};

const V43_RELEASE_VERSION = "4.3.0";
const V43_LEGACY_VERSIONS = ["4.2.0", "V4.2.0"];

function syncV43VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V43_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V43_RELEASE_VERSION}` : V43_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V43_RELEASE_VERSION;
}

requestAnimationFrame(syncV43VisibleVersionOnce);
setTimeout(syncV43VisibleVersionOnce, 250);
setTimeout(syncV43VisibleVersionOnce, 1000);
setTimeout(syncV43VisibleVersionOnce, 2000);
setTimeout(syncV43VisibleVersionOnce, 3000);
setTimeout(syncV43VisibleVersionOnce, 5000);
setTimeout(syncV43VisibleVersionOnce, 7000);
