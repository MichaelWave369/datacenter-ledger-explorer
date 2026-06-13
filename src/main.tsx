import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./v19-public-brief.css";
import "./v20-canonical-review.css";
import "./v21-audit-timeline.css";
import "./v22-change-review.css";
import "./v23-change-approval.css";
import "./v24-role-profiles.css";
import "./v25-two-person-rule.css";
import "./v26-governance-release-manifest.css";
import "./v29-release-archive-index.css";
import "./v30-release-library-mode.css";
import "./v31-release-library-integrity-check.css";
import "./v32-us-map-scaffold.css";
import "./v33-facility-geo-record-schema.css";
import "./v34-facility-geo-import-workbench.css";
import "./v35-geo-staging-bridge.css";

createRoot(document.getElementById("root")!).render(<App />);

async function loadCompanionWidgets() {
  await import("./v28-release-signoff-widget");
  await import("./v28-version-sync");
  await import("./v29-release-archive-index");
  await import("./v30-release-library-mode");
  await import("./v31-release-library-integrity-check");
  await import("./v32-us-map-scaffold");
  await import("./v33-facility-geo-record-schema");
  await import("./v34-facility-geo-import-workbench");
  await import("./v35-geo-staging-bridge");
}

window.setTimeout(() => {
  void loadCompanionWidgets();
}, 0);
