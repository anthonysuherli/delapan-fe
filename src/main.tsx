import { createRoot } from "react-dom/client";
import App from "./App";
import { DuetApp } from "./duet/DuetApp";
import { TrackingApp } from "./tracking/TrackingApp";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/panels.css";
import "./styles/canvas.css";
import "./styles/tracking.css";
import "./styles/motion.css";

const path = window.location.pathname.replace(/\/$/, "") || "/";
const root = createRoot(document.getElementById("root")!);
root.render(path === "/tracking" ? <TrackingApp /> : path === "/duet" ? <DuetApp /> : <App />);
