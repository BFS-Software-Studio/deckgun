import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Apply the saved theme before React renders to avoid a theme flash.
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("deckgun-theme") === "dark" ? "dark" : "light",
);

// Recover from stale dynamically-imported chunks (e.g. mermaid diagram modules)
// after the dev server re-optimizes deps or a new build is deployed.
window.addEventListener("vite:preloadError", () => {
  if (!sessionStorage.getItem("deckgun-reloaded")) {
    sessionStorage.setItem("deckgun-reloaded", "1");
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
