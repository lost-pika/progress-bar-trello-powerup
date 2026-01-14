import { useState } from "react";
import ReactDOM from "react-dom/client";

function Settings() {
  const [hideBadges, setHideBadges] = useState(false);
  const [hideDetailBadges, setHideDetailBadges] = useState(false);
  const [hideProgressBars, setHideProgressBars] = useState(false);
  const [autoFocusMode, setAutoFocusMode] = useState(true);

  function save(key, value) {
    const t = window.TrelloPowerUp.iframe();
    t.set("board", "shared", key, value);
  }

  return (
    <div className="settings-box">

      <h2 className="title">Power-Up Settings</h2>

      <div className="setting-item">
        <span>Hide card badges</span>
        <input
          type="checkbox"
          checked={hideBadges}
          onChange={(e) => {
            setHideBadges(e.target.checked);
            save("hideBadges", e.target.checked);
          }}
        />
      </div>

      <div className="setting-item">
        <span>Hide card detail badges</span>
        <input
          type="checkbox"
          checked={hideDetailBadges}
          onChange={(e) => {
            setHideDetailBadges(e.target.checked);
            save("hideDetailBadges", e.target.checked);
          }}
        />
      </div>

      <div className="setting-item">
        <span>Hide progress bar on cards</span>
        <input
          type="checkbox"
          checked={hideProgressBars}
          onChange={(e) => {
            setHideProgressBars(e.target.checked);
            save("hideProgressBars", e.target.checked);
          }}
        />
      </div>

      <div className="setting-item">
        <span>Auto-enable Focus Mode</span>
        <input
          type="checkbox"
          checked={autoFocusMode}
          onChange={(e) => {
            setAutoFocusMode(e.target.checked);
            save("autoFocus", e.target.checked);
          }}
        />
      </div>

      <button className="remove-btn">
        Unauthorize Power-Up
      </button>

    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Settings />);
