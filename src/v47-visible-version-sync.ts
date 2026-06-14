export {};

import "./v48-public-release-restore-handoff.css";
import "./v48-public-release-restore-handoff";
import "./v48-visible-version-sync";

const V47_RELEASE_VERSION = "4.7.0";
const V47_LEGACY_VERSIONS = ["4.6.0", "V4.6.0"];

function syncV47VisibleVersionOnce() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node !== null) {
    const currentNode = node;
    let nextValue = currentNode.nodeValue ?? "";

    for (const legacyVersion of V47_LEGACY_VERSIONS) {
      nextValue = nextValue.split(legacyVersion).join(legacyVersion.startsWith("V") ? `V${V47_RELEASE_VERSION}` : V47_RELEASE_VERSION);
    }

    if (currentNode.nodeValue !== nextValue) {
      currentNode.nodeValue = nextValue;
    }

    node = walker.nextNode();
  }

  document.documentElement.dataset.dclReleaseVersion = V47_RELEASE_VERSION;
}

requestAnimationFrame(syncV47VisibleVersionOnce);
setTimeout(syncV47VisibleVersionOnce, 250);
setTimeout(syncV47VisibleVersionOnce, 1000);
setTimeout(syncV47VisibleVersionOnce, 2000);
setTimeout(syncV47VisibleVersionOnce, 3000);
setTimeout(syncV47VisibleVersionOnce, 5000);
setTimeout(syncV47VisibleVersionOnce, 7000);
setTimeout(syncV47VisibleVersionOnce, 9000);
