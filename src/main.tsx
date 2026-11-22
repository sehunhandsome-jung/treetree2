import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GardenProvider } from "./context/GardenContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GardenProvider>
      <App />
    </GardenProvider>
  </StrictMode>
);