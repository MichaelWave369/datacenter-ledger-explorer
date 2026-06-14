export {};

import "./v46-public-release-index.css";
import "./v46-public-release-index";
import "./v46-visible-version-sync";

const V45_RELEASE_VERSION = "4.5.0";
const V45_LEGACY_VERSIONS = ["4.4.0", "V4.4.0"];

function syncV45VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V45_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V45_RELEASE_VERSION}` : V45_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V45_RELEASE_VERSION;
}

requestAnimationFrame(syncV45VisibleVersionOnce);
setTimeout(syncV45VisibleVersionOnce, 250);
setTimeout(syncV45VisibleVersionOnce, 1000);
setTimeout(syncV45VisibleVersionOnce, 2000);
setTimeout(syncV45VisibleVersionOnce, 3000);
setTimeout(syncV45VisibleVersionOnce, 5000);
setTimeout(syncV45VisibleVersionOnce, 7000);
setTimeout(syncV45VisibleVersionOnce, 9000);
