export {};

import "./v51-public-console-quick-actions.css";
import "./v51-public-console-quick-actions";
import "./v51-visible-version-sync";

const V50_RELEASE_VERSION = "5.0.0";
const V50_LEGACY_VERSIONS = ["4.9.0", "V4.9.0"];

function syncV50VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V50_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V50_RELEASE_VERSION}` : V50_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V50_RELEASE_VERSION;
}

requestAnimationFrame(syncV50VisibleVersionOnce);
setTimeout(syncV50VisibleVersionOnce, 250);
setTimeout(syncV50VisibleVersionOnce, 1000);
setTimeout(syncV50VisibleVersionOnce, 2000);
setTimeout(syncV50VisibleVersionOnce, 3000);
setTimeout(syncV50VisibleVersionOnce, 5000);
setTimeout(syncV50VisibleVersionOnce, 7000);
setTimeout(syncV50VisibleVersionOnce, 9000);
