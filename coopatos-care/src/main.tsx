import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyBrandPreset } from "./config/brand";
import "./index.css";

applyBrandPreset();

createRoot(document.getElementById("root")!).render(<App />);
