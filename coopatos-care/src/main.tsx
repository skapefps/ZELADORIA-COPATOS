import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyBrandPreset, getStoredBrandPreset } from "./config/brand";
import "./index.css";

applyBrandPreset(getStoredBrandPreset());

createRoot(document.getElementById("root")!).render(<App />);
