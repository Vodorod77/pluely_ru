import React from "react";
import ReactDOM from "react-dom/client";
import Overlay from "./components/Overlay";
import { AppProvider, ThemeProvider, I18nProvider } from "./contexts";
import "./global.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import AppRoutes from "./routes";

const currentWindow = getCurrentWindow();
const windowLabel = currentWindow.label;

// Render different components based on window label
if (windowLabel.startsWith("capture-overlay-")) {
  const monitorIndex = parseInt(windowLabel.split("-")[2], 10) || 0;
  // Render overlay without providers
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <I18nProvider>
        <Overlay monitorIndex={monitorIndex} />
      </I18nProvider>
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <I18nProvider>
        <ThemeProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </ThemeProvider>
      </I18nProvider>
    </React.StrictMode>
  );
}
