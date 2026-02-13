import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeThemeMode } from "./lib/theme-mode";

initializeThemeMode();

createRoot(document.getElementById("root")!).render(<App />);
