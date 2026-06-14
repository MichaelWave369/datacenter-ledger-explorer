export {};

const V49_RELEASE_VERSION = "4.9.0";
const V49_LEGACY_VERSIONS = ["4.8.0", "V4.8.0"];

function syncV49VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V49_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V49_RELEASE_VERSION}` : V49_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V49_RELEASE_VERSION;
}

requestAnimationFrame(syncV49VisibleVersionOnce);
setTimeout(syncV49VisibleVersionOnce, 250);
setTimeout(syncV49VisibleVersionOnce, 1000);
setTimeout(syncV49VisibleVersionOnce, 2000);
setTimeout(syncV49VisibleVersionOnce, 3000);
setTimeout(syncV49VisibleVersionOnce, 5000);
setTimeout(syncV49VisibleVersionOnce, 7000);
setTimeout(syncV49VisibleVersionOnce, 9000);
