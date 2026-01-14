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
    }
  }

  if (loading) {
    return <div className="settings-container"><p>Loading settings...</p></div>;
  }

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <div className="header-icon">⚙️</div>
        <h1 className="header-title">Customize your task card display</h1>
      </div>

      {/* Customize Section */}
      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Hide card badges</span>
            <span className="setting-desc">Remove all badges from cards</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideBadges}
              onChange={(e) => {
                setHideBadges(e.target.checked);
                save("hideBadges", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Hide card detail badges</span>
            <span className="setting-desc">Remove badges from expanded view</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideDetailBadges}
              onChange={(e) => {
                setHideDetailBadges(e.target.checked);
                save("hideDetailBadges", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Progress Bar Setting with Status */}
        <div className="setting-item highlight">
          <div className="setting-content">
            <span className="setting-label">Hide progress bar from card badges</span>
            <span className="setting-desc">Remove progress bars from all cards</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideProgressBars}
              onChange={(e) => {
                setHideProgressBars(e.target.checked);
                save("hideProgressBars", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {hideProgressBars && (
          <div className="status-message success">
            <span className="status-icon">✓</span>
            <span className="status-text">Progress bars hidden on all cards</span>
          </div>
        )}

        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Auto-enable Focus Mode</span>
            <span className="setting-desc">Start Focus Mode when timer begins</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoFocusMode}
              onChange={(e) => {
                setAutoFocusMode(e.target.checked);
                save("autoFocus", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Divider */}
      <div className="divider"></div>

      {/* Unauthorize Section */}
      <div className="settings-section">
        <h2 className="section-title unauthorized-title">Unauthorize Power-Up</h2>
        <p className="unauthorized-desc">Remove this integration from workspace</p>
        <button className="remove-btn" onClick={handleUnauthorize}>
          <span className="remove-icon">⚠️</span>
          Remove
        </button>
      </div>

      {/* Live Preview Section */}
      <div className="preview-section">
        <h2 className="section-title">Live Preview</h2>
        <p className="preview-desc">See how your cards will look</p>
        
        <div className="preview-card">
          <div className="preview-header">
            <span className="preview-title">Sample Task</span>
            <span className="focus-badge">🎯 Focus ON</span>
          </div>
          <div className="preview-content">
            {hideProgressBars ? (
              <p className="preview-message">Progress bars are currently hidden</p>
            ) : (
              <div className="preview-progress">
                <div className="progress-bar"></div>
              </div>
            )}
            <div className="preview-meta">
              <span className="meta-item">⏱️ 01:23:45</span>
              <span className="meta-item">⏰ 02:00:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Settings />);