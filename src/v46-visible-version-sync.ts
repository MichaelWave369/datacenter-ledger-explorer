export {};

import "./v47-public-release-compare-tool.css";
import "./v47-public-release-compare-tool";
import "./v47-visible-version-sync";

const V46_RELEASE_VERSION = "4.6.0";
const V46_LEGACY_VERSIONS = ["4.5.0", "V4.5.0"];

function syncV46VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V46_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V46_RELEASE_VERSION}` : V46_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V46_RELEASE_VERSION;
}

requestAnimationFrame(syncV46VisibleVersionOnce);
setTimeout(syncV46VisibleVersionOnce, 250);
setTimeout(syncV46VisibleVersionOnce, 1000);
setTimeout(syncV46VisibleVersionOnce, 2000);
setTimeout(syncV46VisibleVersionOnce, 3000);
setTimeout(syncV46VisibleVersionOnce, 5000);
setTimeout(syncV46VisibleVersionOnce, 7000);
setTimeout(syncV46VisibleVersionOnce, 9000);
