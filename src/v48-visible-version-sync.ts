export {};

import "./v49-public-release-integrity-seal.css";
import "./v49-public-release-integrity-seal";
import "./v49-visible-version-sync";

const V48_RELEASE_VERSION = "4.8.0";
const V48_LEGACY_VERSIONS = ["4.7.0", "V4.7.0"];

function syncV48VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V48_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V48_RELEASE_VERSION}` : V48_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V48_RELEASE_VERSION;
}

requestAnimationFrame(syncV48VisibleVersionOnce);
setTimeout(syncV48VisibleVersionOnce, 250);
setTimeout(syncV48VisibleVersionOnce, 1000);
setTimeout(syncV48VisibleVersionOnce, 2000);
setTimeout(syncV48VisibleVersionOnce, 3000);
setTimeout(syncV48VisibleVersionOnce, 5000);
setTimeout(syncV48VisibleVersionOnce, 7000);
setTimeout(syncV48VisibleVersionOnce, 9000);
