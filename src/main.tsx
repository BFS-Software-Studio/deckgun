import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Apply the saved theme before React renders to avoid a light→dark flash.
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("deckgun-theme") === "dark" ? "dark" : "light",
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
