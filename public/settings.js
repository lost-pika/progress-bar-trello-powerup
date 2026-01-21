import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

function Settings() {
  const t = window.TrelloPowerUp.iframe();

  // BOARD SETTINGS
  const [hideBadges, setHideBadges] = useState(false);
  const [hideDetailBadges, setHideDetailBadges] = useState(false);
  const [hideProgressBars, setHideProgressBars] = useState(false);
  const [autoFocusMode, setAutoFocusMode] = useState(true);

  // CARD TIME TRACKER VALUES
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [estimated, setEstimated] = useState(8 * 3600);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [autoTracking, setAutoTracking] = useState(false);

  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  // LOAD ALL DATA
  useEffect(() => {
    Promise.all([
      // Board settings
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "autoFocus"),

      // Card settings
      t.get("card", "shared")
    ]).then(([badges, detailBadges, progressBars, autoFocus, cardData]) => {

      // --- BOARD SETTINGS ---
      setHideBadges(badges || false);
      setHideDetailBadges(detailBadges || false);
      setHideProgressBars(progressBars || false);
      setAutoFocusMode(autoFocus !== false);

      // --- CARD TIME TRACKER ---
      setProgress(cardData.progress || 0);
      setElapsed(cardData.elapsed || 0);
      setEstimated(cardData.estimated || 8 * 3600);
      setRunning(cardData.running || false);
      setStartTime(cardData.startTime || null);
      setAutoTracking(cardData.auto || false);

      setLoading(false);

      if (cardData.running) startTick();
    });
  }, []);

  function saveBoard(key, value) {
    t.set("board", "shared", key, value);
  }

  function saveCardState(newState = {}) {
    t.set("card", "shared", {
      progress,
      elapsed,
      estimated,
      running,
      startTime,
      auto: autoTracking,
      ...newState
    });
  }

  // REAL-TIME TICKER
  function startTick() {
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      if (running) {
        const now = Date.now();
        const liveElapsed = elapsed + Math.floor((now - startTime) / 1000);
        document.getElementById("elapsed-display").innerHTML = format(liveElapsed);
      }
    }, 1000);
  }

  function format(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // TIMER BUTTONS
  function handleTimerToggle() {
    if (running) {
      const now = Date.now();
      const newElapsed = elapsed + Math.floor((now - startTime) / 1000);
      setElapsed(newElapsed);
      setRunning(false);
      setStartTime(null);
      saveCardState({ running: false, elapsed: newElapsed, startTime: null });
    } else {
      const now = Date.now();
      setStartTime(now);
      setRunning(true);
      saveCardState({ running: true, startTime: now });
      startTick();
    }
  }

  function handleReset() {
    setElapsed(0);
    setRunning(false);
    setStartTime(null);
    saveCardState({ elapsed: 0, running: false, startTime: null });
  }

  // UNAUTHORIZE PROPERLY
  function handleUnauthorize() {
    if (window.confirm("Unauthorize this Power-Up?")) {
      t.set("member", "private", "authorized", false)
        .then(() => t.closePopup());
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="settings-container">
      
      {/* HEADER */}
      <div className="settings-header">
        <div className="header-icon">⚙️</div>
        <h1 className="header-title">Customize your task card display</h1>
      </div>

      {/* SETTINGS SECTION */}
      <div className="settings-section">

        {/* --- Hide Card Badges --- */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Hide card badges</span>
            <span className="setting-desc">Remove all badges</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideBadges}
              onChange={(e) => {
                setHideBadges(e.target.checked);
                saveBoard("hideBadges", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* --- Hide Detail Badges --- */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Hide card detail badges</span>
            <span className="setting-desc">Hide badges in expanded card</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideDetailBadges}
              onChange={(e) => {
                setHideDetailBadges(e.target.checked);
                saveBoard("hideDetailBadges", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* --- Progress Bar Toggle --- */}
        <div className={`setting-item ${hideProgressBars ? "highlight" : ""}`}>
          <div className="setting-content">
            <span className="setting-label">Hide progress bar</span>
            <span className="setting-desc">Show only %</span>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={hideProgressBars}
              onChange={(e) => {
                setHideProgressBars(e.target.checked);
                saveBoard("hideProgressBars", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {hideProgressBars && (
          <div className="status-message">
            ✓ Progress bars hidden on all cards
          </div>
        )}

        {/* --- AUTO ENABLE FOCUS MODE --- */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Auto-enable Focus Mode</span>
            <span className="setting-desc">Starts when time tracking begins</span>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={autoFocusMode}
              onChange={(e) => {
                setAutoFocusMode(e.target.checked);
                saveBoard("autoFocus", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

      </div>

      {/* --- TIME TRACKER SECTION (FULLY FUNCTIONAL) --- */}
      <div className="settings-section">
        <h2 className="section-title">Time Tracker</h2>

        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Elapsed Time</span>
            <span id="elapsed-display" className="setting-desc" style={{fontSize:"15px"}}>
              {format(
                running
                  ? elapsed + Math.floor((Date.now() - startTime) / 1000)
                  : elapsed
              )}
            </span>
          </div>

          <button className="toggle-slider" onClick={handleTimerToggle} style={{width:"120px", height:"28px", background:"#2ec4b6", borderRadius:"6px", color:"white"}}>
            {running ? "Stop" : "Start"}
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Estimated</span>
            <span className="setting-desc">{format(estimated)}</span>
          </div>
        </div>

        <button
          className="reset-btn"
          onClick={handleReset}
          style={{marginTop:"10px"}}
        >
          Reset Time
        </button>

        {/* Auto Tracking */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Auto Tracking</span>
            <span className="setting-desc">Track time automatically</span>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={autoTracking}
              onChange={(e) => {
                setAutoTracking(e.target.checked);
                saveCardState({ auto: e.target.checked });
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

      </div>

      {/* UNAUTHORIZE */}
      <div className="settings-section">
        <h2 className="section-title unauthorized-title">Unauthorize Power-Up</h2>
        <button className="remove-btn" onClick={handleUnauthorize}>
          ⚠️ Remove
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Settings />);
