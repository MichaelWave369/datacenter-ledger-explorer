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
import "./v28-release-signoff-widget";
import "./v28-version-sync";

createRoot(document.getElementById("root")!).render(<App />);
