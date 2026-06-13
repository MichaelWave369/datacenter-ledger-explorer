import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./v19-public-brief.css";
import "./v20-canonical-review.css";
import "./v21-audit-timeline.css";
import "./v22-change-review.css";
import "./v23-change-approval.css";

createRoot(document.getElementById("root")!).render(<App />);
