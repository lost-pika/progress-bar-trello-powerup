import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

function Settings() {
  const [hideBadges, setHideBadges] = useState(false);
  const [hideDetailBadges, setHideDetailBadges] = useState(false);
  const [hideProgressBars, setHideProgressBars] = useState(false);
  const [autoFocusMode, setAutoFocusMode] = useState(true);
  const [loading, setLoading] = useState(true);

  const t = window.TrelloPowerUp.iframe();

  // Load settings from board on mount
  useEffect(() => {
    Promise.all([
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "autoFocus")
    ]).then(([badges, detailBadges, progressBars, autoFocus]) => {
      setHideBadges(badges || false);
      setHideDetailBadges(detailBadges || false);
      setHideProgressBars(progressBars || false);
      setAutoFocusMode(autoFocus !== false);
      setLoading(false);
    });
  }, []);

  function save(key, value) {
    t.set("board", "shared", key, value);
  }

  function handleUnauthorize() {
    if (window.confirm("Are you sure you want to unauthorize this Power-Up?")) {
      t.closePopup();
      // Optionally: Clear all settings
      t.remove("board", "shared", "hideBadges");
      t.remove("board", "shared", "hideDetailBadges");
      t.remove("board", "shared", "hideProgressBars");
      t.remove("board", "shared", "autoFocus");
    }
  }

  if (loading) {
    return <div className="settings-box"><p>Loading settings...</p></div>;
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

      <button className="remove-btn" onClick={handleUnauthorize}>
        Unauthorize Power-Up
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Settings />);