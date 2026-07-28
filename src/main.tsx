import { createRoot } from "react-dom/client";
import { initAnalytics } from "./analytics";
import { Root } from "./Root";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/panels.css";
import "./styles/console.css";
import "./styles/landing.css";
import "./styles/canvas.css";
import "./styles/tracking.css";
import "./styles/auth.css";
import "./styles/site.css";
import "./styles/site-shell.css";
import "./styles/site-docs.css";
import "./styles/motion.css";

initAnalytics();

createRoot(document.getElementById("root")!).render(<Root />);
