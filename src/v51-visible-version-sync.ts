export {};

import "./v52-public-console-guided-flow.css";
import "./v52-public-console-guided-flow-fixed";
import "./v52-visible-version-sync";

const V51_RELEASE_VERSION = "5.1.0";
const V51_LEGACY_VERSIONS = ["5.0.0", "V5.0.0"];

function syncV51VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V51_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V51_RELEASE_VERSION}` : V51_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V51_RELEASE_VERSION;
}

requestAnimationFrame(syncV51VisibleVersionOnce);
setTimeout(syncV51VisibleVersionOnce, 250);
setTimeout(syncV51VisibleVersionOnce, 1000);
setTimeout(syncV51VisibleVersionOnce, 2000);
setTimeout(syncV51VisibleVersionOnce, 3000);
setTimeout(syncV51VisibleVersionOnce, 5000);
setTimeout(syncV51VisibleVersionOnce, 7000);
setTimeout(syncV51VisibleVersionOnce, 9000);
