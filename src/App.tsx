import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import "./App.css";

function App() {
  // tldraw runs without a licenseKey in development. For distributed
  // `tauri build` releases, pass your hobby key here:
  //   <Tldraw licenseKey="..." />
  // The "made with tldraw" watermark stays visible (accepted for hobby use).
  return (
    <div className="tldraw-container">
      <Tldraw />
    </div>
  );
}

export default App;
