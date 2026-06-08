import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import {
  applyBrandPreset,
  getStoredBrandPreset,
  syncBrandPresetFromServer,
} from "./config/brand";
import "./index.css";

applyBrandPreset(getStoredBrandPreset());
void syncBrandPresetFromServer();

createRoot(document.getElementById("root")!).render(<App />);
