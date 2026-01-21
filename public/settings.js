import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function parseTime(str) {
  const parts = str.split(":").map(Number);
  if (parts.length !== 3) return 8 * 3600;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function Settings() {
  const t = window.TrelloPowerUp.iframe();

  // -------------------------
  // BOARD SETTINGS
  // -------------------------
  const [hideBadges, setHideBadges] = useState(false);
  const [hideDetailBadges, setHideDetailBadges] = useState(false);
  const [hideProgressBars, setHideProgressBars] = useState(false);
  const [autoFocusMode, setAutoFocusMode] = useState(false);

  // -------------------------
  // TIME TRACKER STATE
  // -------------------------
  const [collapsed, setCollapsed] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [estimated, setEstimated] = useState(8 * 3600);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [autoTrack, setAutoTrack] = useState(false);

  const [editEst, setEditEst] = useState(false);
  const [estInput, setEstInput] = useState("08:00:00");

  const [loading, setLoading] = useState(true);

  // -------------------------
  // LOAD INITIAL DATA
  // -------------------------
  useEffect(() => {
    Promise.all([
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "autoFocus"),

      t.get("card", "shared"),
    ]).then(([b1, b2, b3, autoFocus, card]) => {
      setHideBadges(b1 || false);
      setHideDetailBadges(b2 || false);
      setHideProgressBars(b3 || false);
      setAutoFocusMode(autoFocus || false);

      if (card) {
        setElapsed(card.elapsed || 0);
        setEstimated(card.estimated || 8 * 3600);
        setRunning(card.running || false);
        setStartTime(card.startTime || null);
        setAutoTrack(card.auto || false);
        setEstInput(formatTime(card.estimated || 8 * 3600));
      }

      setLoading(false);
      if (card?.running) startTicker();
    });
  }, []);

  // -------------------------
  // TIKER FOR LIVE Timer
  // -------------------------
  function startTicker() {
    setInterval(() => {
      if (running && startTime) {
        const sec = elapsed + Math.floor((Date.now() - startTime) / 1000);
        const label = document.getElementById("elapsedLive");
        if (label) label.innerText = formatTime(sec);
      }
    }, 1000);
  }

  // -------------------------
  // SAVE CARD TIMER DATA
  // -------------------------
  function saveTracker() {
    t.set("card", "shared", {
      elapsed,
      estimated,
      running,
      startTime,
      auto: autoTrack,
    });
  }

  // -------------------------
  // TIMER START/STOP
  // -------------------------
  function toggleTimer() {
    if (running) {
      // STOP
      const now = Date.now();
      setElapsed(elapsed + Math.floor((now - startTime) / 1000));
      setRunning(false);
      setStartTime(null);

      // disable focus mode
      t.set("card", "shared", "focusMode", false);
    } else {
      // START
      setRunning(true);
      setStartTime(Date.now());
      startTicker();

      // auto-enable focus mode
      t.get("board", "shared", "autoFocus").then((auto) => {
        if (auto) {
          t.set("card", "shared", "focusMode", true);
        }
      });
    }

    setTimeout(saveTracker, 50);
  }

  // -------------------------
  // RESET TIMER
  // -------------------------
  function resetTimer() {
    setElapsed(0);
    setRunning(false);
    setStartTime(null);
    saveTracker();
  }

  // -------------------------
  // UPDATE ESTIMATED
  // -------------------------
  function saveEstimated() {
    const sec = parseTime(estInput);
    setEstimated(sec);
    setEditEst(false);
    saveTracker();
  }

  // -------------------------
  // UNAOTHORIZE
  // -------------------------
  async function handleUnauthorize() {
    if (!window.confirm("Remove this Power-Up and clear ALL stored data?"))
      return;

    await t.set("board", "shared", null);
    await t.set("card", "shared", null);
    await t.set("member", "private", null);
    await t.remove("member", "private", "authorized");

    return t.closePopup();
  }

  const liveElapsed =
    running && startTime
      ? elapsed + Math.floor((Date.now() - startTime) / 1000)
      : elapsed;

  if (loading) return <p>Loading…</p>;

  return (
    <div className="settings-container">
      {/* HEADER */}
      <div className="settings-header">
        <div className="header-icon">⚙️</div>
        <h1 className="header-title">Progress Settings</h1>
      </div>

      {/* TIME TRACKER SECTION */}
      <div className="settings-section">
        <div
          className="setting-item"
          style={{ cursor: "pointer", justifyContent: "space-between" }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="setting-label">
            {collapsed ? "⯈" : "⯆"} Time Tracker
          </span>
          <span>{formatTime(liveElapsed)}</span>
        </div>

        {!collapsed && (
          <div className="time-box" style={{ marginTop: 12 }}>
            {/* TIME ROW */}
            <div className="time-row">
              <div>
                <div style={{ opacity: 0.6 }}>Elapsed</div>
                <div id="elapsedLive" className="elapsed">
                  {formatTime(liveElapsed)}
                </div>
              </div>

              <div>
                <div style={{ opacity: 0.6 }}>Estimated</div>
                {!editEst ? (
                  <div
                    className="estimated"
                    style={{ cursor: "pointer" }}
                    onClick={() => setEditEst(true)}
                  >
                    {formatTime(estimated)} ✏️
                  </div>
                ) : (
                  <input
                    value={estInput}
                    onChange={(e) => setEstInput(e.target.value)}
                    onBlur={saveEstimated}
                    style={{
                      width: "90px",
                      background: "#333",
                      padding: "4px",
                      textAlign: "center",
                      borderRadius: 4,
                      color: "white",
                    }}
                  />
                )}
              </div>
            </div>

            {/* BUTTONS */}
            <button className="track-btn" onClick={toggleTimer}>
              {running ? "⏸ Stop Tracking" : "▶ Start Tracking"}
            </button>

            <button className="reset-btn" onClick={resetTimer}>
              Reset
            </button>

            {/* AUTO TRACK */}
            <div className="auto-row">
              Enable automatic tracking
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={autoTrack}
                  onChange={(e) => {
                    setAutoTrack(e.target.checked);
                    saveTracker();
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------- */}
      {/* NORMAL TOGGLES          */}
      {/* ----------------------- */}
      <div className="settings-section">
        {/* HIDE BADGES */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Hide card badges</span>
            <span className="setting-desc">Remove badges from card front</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideBadges}
              onChange={(e) => {
                setHideBadges(e.target.checked);
                t.set("board", "shared", "hideBadges", e.target.checked);
                t.refresh();
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* HIDE DETAIL BADGES */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Hide card detail badges</span>
            <span className="setting-desc">
              Remove badges inside expanded view
            </span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideDetailBadges}
              onChange={(e) => {
                setHideDetailBadges(e.target.checked);
                t.set("board", "shared", "hideDetailBadges", e.target.checked);
                t.refresh();
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* HIDE PROGRESS BARS */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">
              Hide progress bar from card badges
            </span>
            <span className="setting-desc">Show only percentage</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideProgressBars}
              onChange={(e) => {
                setHideProgressBars(e.target.checked);
                t.set("board", "shared", "hideProgressBars", e.target.checked);
                t.refresh();
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* FOCUS MODE */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Auto-enable Focus Mode</span>
            <span className="setting-desc">
              Start Focus Mode when timer begins
            </span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoFocusMode}
              onChange={(e) => {
                setAutoFocusMode(e.target.checked);
                t.set("board", "shared", "autoFocus", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* UNAUTHORIZE */}
      <div className="settings-section">
        <h2 className="section-title unauthorized-title">
          Unauthorize Power-Up
        </h2>
        <p className="unauthorized-desc">Remove this integration completely</p>
        <button className="remove-btn" onClick={handleUnauthorize}>
          <span className="remove-icon">⚠️</span>
          Remove
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Settings />);
