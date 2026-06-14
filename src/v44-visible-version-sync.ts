export {};

import "./v45-public-share-release-manifest.css";
import "./v45-public-share-release-manifest";
import "./v45-visible-version-sync";

const V44_RELEASE_VERSION = "4.4.0";
const V44_LEGACY_VERSIONS = ["4.3.0", "V4.3.0"];

function syncV44VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V44_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V44_RELEASE_VERSION}` : V44_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V44_RELEASE_VERSION;
}

requestAnimationFrame(syncV44VisibleVersionOnce);
setTimeout(syncV44VisibleVersionOnce, 250);
setTimeout(syncV44VisibleVersionOnce, 1000);
setTimeout(syncV44VisibleVersionOnce, 2000);
setTimeout(syncV44VisibleVersionOnce, 3000);
setTimeout(syncV44VisibleVersionOnce, 5000);
setTimeout(syncV44VisibleVersionOnce, 7000);
setTimeout(syncV44VisibleVersionOnce, 9000);
