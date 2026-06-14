export {};

const V53_RELEASE_VERSION = "5.3.0";
const V53_LEGACY_VERSIONS = [
  "4.6.0",
  "V4.6.0",
  "4.7.0",
  "V4.7.0",
  "4.8.0",
  "V4.8.0",
  "4.9.0",
  "V4.9.0",
  "5.0.0",
  "V5.0.0",
  "5.1.0",
  "V5.1.0",
  "5.2.0",
  "V5.2.0"
];

function syncV53VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V53_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V53_RELEASE_VERSION}` : V53_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V53_RELEASE_VERSION;
}

requestAnimationFrame(syncV53VisibleVersionOnce);
setTimeout(syncV53VisibleVersionOnce, 250);
setTimeout(syncV53VisibleVersionOnce, 1000);
setTimeout(syncV53VisibleVersionOnce, 2000);
setTimeout(syncV53VisibleVersionOnce, 3000);
setTimeout(syncV53VisibleVersionOnce, 5000);
setTimeout(syncV53VisibleVersionOnce, 7000);
setTimeout(syncV53VisibleVersionOnce, 9000);
setTimeout(syncV53VisibleVersionOnce, 12000);
