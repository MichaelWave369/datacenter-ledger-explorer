export {};

import "./v43-public-share-approval-gate.css";
import "./v43-public-share-approval-gate";
import "./v43-visible-version-sync";

const V42_RELEASE_VERSION = "4.2.0";
const V42_LEGACY_VERSIONS = ["4.1.0", "V4.1.0"];

function syncV42VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V42_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V42_RELEASE_VERSION}` : V42_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V42_RELEASE_VERSION;
}

requestAnimationFrame(syncV42VisibleVersionOnce);
setTimeout(syncV42VisibleVersionOnce, 250);
setTimeout(syncV42VisibleVersionOnce, 1000);
setTimeout(syncV42VisibleVersionOnce, 2000);
setTimeout(syncV42VisibleVersionOnce, 3000);
setTimeout(syncV42VisibleVersionOnce, 5000);
setTimeout(syncV42VisibleVersionOnce, 7000);
