import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function parseTime(str) {
  const p = str.split(":").map(Number);
  if (p.length !== 3) return 8 * 3600;
  return p[0] * 3600 + p[1] * 60 + p[2];
}

function Settings() {
  const t = window.TrelloPowerUp.iframe();

  // BOARD SETTINGS
  const [hideBadges, setHideBadges] = useState(false);
  const [hideDetailBadges, setHideDetailBadges] = useState(false);
  const [hideProgressBars, setHideProgressBars] = useState(false);
  const [autoFocusMode, setAutoFocusMode] = useState(false);
  const [autoTrackMode, setAutoTrackMode] = useState("off");

  // TIME TRACKER
  const [collapsed, setCollapsed] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [estimated, setEstimated] = useState(8 * 3600);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [autoTrack, setAutoTrack] = useState(false);
  const [editEst, setEditEst] = useState(false);
  const [estInput, setEstInput] = useState("08:00:00");

  const [loading, setLoading] = useState(true);
  let ticker;

  useEffect(() => {
    Promise.all([
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
      t.get("board", "shared", "autoFocus"),
      t.get("board", "shared", "autoTrackMode"), // NEW
      t.get("card", "shared")
    ]).then(
      ([
        b1, b2, b3, autoFocus, mode,
        cardData
      ]) => {
        setHideBadges(b1 || false);
        setHideDetailBadges(b2 || false);
        setHideProgressBars(b3 || false);
        setAutoFocusMode(autoFocus || false);
        setAutoTrackMode(mode || "off");

        if (cardData) {
          setElapsed(cardData.elapsed || 0);
          setEstimated(cardData.estimated || 8 * 3600);
          setRunning(cardData.running || false);
          setStartTime(cardData.startTime || null);
          setAutoTrack(cardData.auto || false);
          setEstInput(formatTime(cardData.estimated || 8 * 3600));

          if (cardData.running) startTicker();
        }

        setLoading(false);
      }
    );
  }, []);

  function startTicker() {
    if (ticker) return;
    ticker = setInterval(() => {
      if (running && startTime) {
        const sec = elapsed + Math.floor((Date.now() - startTime) / 1000);
        const el = document.getElementById("elapsedLive");
        if (el) el.innerText = formatTime(sec);
      }
    }, 1000);
  }

  function saveTracker() {
    t.set("card", "shared", {
      elapsed,
      estimated,
      running,
      startTime,
      auto: autoTrack
    });
  }

  function toggleTimer() {
    if (running) {
      const now = Date.now();
      setElapsed(elapsed + Math.floor((now - startTime) / 1000));
      setRunning(false);
      setStartTime(null);

      t.set("card", "shared", "focusMode", false);
    } else {
      setRunning(true);
      setStartTime(Date.now());
      startTicker();

      t.get("board", "shared", "autoFocus").then(auto => {
        if (auto) t.set("card", "shared", "focusMode", true);
      });
    }

    setTimeout(saveTracker, 50);
  }

  function resetTimer() {
    setElapsed(0);
    setRunning(false);
    setStartTime(null);
    saveTracker();
  }

  async function saveEstimated() {
    const sec = parseTime(estInput);
    setEstimated(sec);
    setEditEst(false);
    saveTracker();
  }

  async function saveBoardSetting(key, value) {
    await t.set("board", "shared", key, value);
    t.refresh();
  }

  async function handleAutoTrackChange(value) {
    setAutoTrackMode(value);
    await t.set("board", "shared", "autoTrackMode", value);

    // ask lists popup
    if (value === "list" || value === "both") {
      return t.popup({
        title: "Select Lists",
        url: "./auto-track-lists.html",
        height: 350
      });
    }
  }

  async function handleUnauthorize() {
    if (!window.confirm("Remove this Power-Up and clear ALL data?")) return;

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

  if (loading) return <p style={{padding:20}}>Loading…</p>;

  return (
    <div className="settings-container">

      {/* ====== HEADER ====== */}
      <div className="settings-header">
        <div className="header-icon">⚙️</div>
        <h1 className="header-title">Progress Settings</h1>
      </div>

      {/* ====== TIME TRACKER COLLAPSIBLE ====== */}
      <div className="settings-section">
        <div
          className="setting-item"
          style={{cursor:"pointer", justifyContent:"space-between"}}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="setting-label">
            {collapsed ? "⯈" : "⯆"} Time Tracker
          </span>
          <span>{formatTime(liveElapsed)}</span>
        </div>

        {!collapsed && (
          <div className="time-box">

            <div className="time-row">
              <div>
                <div style={{opacity:.6}}>Elapsed</div>
                <div id="elapsedLive" className="elapsed">
                  {formatTime(liveElapsed)}
                </div>
              </div>

              <div>
                <div style={{opacity:.6}}>Estimated</div>

                {!editEst ? (
                  <div
                    className="estimated"
                    onClick={() => setEditEst(true)}
                    style={{cursor:"pointer"}}
                  >
                    {formatTime(estimated)} ✏️
                  </div>
                ) : (
                  <input
                    value={estInput}
                    onChange={(e)=>setEstInput(e.target.value)}
                    onBlur={saveEstimated}
                    style={{
                      width:90, background:"#333",
                      padding:4, textAlign:"center",
                      color:"white", borderRadius:4
                    }}
                  />
                )}
              </div>
            </div>

            <button className="track-btn" onClick={toggleTimer}>
              {running ? "⏸ Stop Tracking" : "▶ Start Tracking"}
            </button>

            <button className="reset-btn" onClick={resetTimer}>Reset</button>

            <div className="auto-row">
              <span>Enable automatic tracking</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={autoTrack}
                  onChange={e=>{
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

      {/* ====== DISPLAY OPTIONS ====== */}
      <div className="settings-section">

        {/* Hide card badges */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Hide card badges</span>
            <span className="setting-desc">Remove badges from card front</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideBadges}
              onChange={e=>{
                setHideBadges(e.target.checked);
                saveBoardSetting("hideBadges", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Hide detail badges */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Hide card detail badges</span>
            <span className="setting-desc">Remove badges inside expanded card</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideDetailBadges}
              onChange={e=>{
                setHideDetailBadges(e.target.checked);
                saveBoardSetting("hideDetailBadges", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Hide progress bar */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Hide progress bar</span>
            <span className="setting-desc">Show only percentage</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideProgressBars}
              onChange={e=>{
                setHideProgressBars(e.target.checked);
                saveBoardSetting("hideProgressBars", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Auto Focus */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Auto-enable Focus Mode</span>
            <span className="setting-desc">Enable focus when timer starts</span>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoFocusMode}
              onChange={e=>{
                setAutoFocusMode(e.target.checked);
                saveBoardSetting("autoFocus", e.target.checked);
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Auto Track Mode */}
        <div className="setting-item">
          <div className="setting-content">
            <span className="setting-label">Auto Tracking Mode</span>
            <span className="setting-desc">When should timer start automatically?</span>
          </div>

          <select
            value={autoTrackMode}
            onChange={e=>handleAutoTrackChange(e.target.value)}
            style={{padding:"6px 10px", borderRadius:6, border:"1px solid #ccc"}}
          >
            <option value="off">Off</option>
            <option value="open">On card open</option>
            <option value="list">On list move</option>
            <option value="both">Both</option>
          </select>
        </div>

      </div>

      {/* ====== REMOVE POWER-UP ====== */}
      <div className="settings-section">
        <h2 className="section-title unauthorized-title">Unauthorize Power-Up</h2>
        <p className="unauthorized-desc">
          Remove this integration and clear all settings
        </p>

        <button className="remove-btn" onClick={handleUnauthorize}>
          <span className="remove-icon">⚠️</span> Remove
        </button>
      </div>

      {/* ====== INLINE CSS ====== */}
      <style>{`
        * { box-sizing: border-box; }
        .settings-container { padding: 14px; font-family: -apple-system; }
        .settings-header { display:flex; gap:12px; align-items:flex-start; margin-bottom:24px; }
        .header-icon { font-size:24px; }
        .header-title { font-size:16px; font-weight:600; }

        .settings-section {
          margin-bottom:22px;
          background:#f8f8f8;
          padding:12px;
          border-radius:8px;
        }

        .setting-item {
          display:flex; justify-content:space-between;
          padding:12px 0;
          border-bottom:1px solid #ddd;
        }
        .setting-item:last-child { border-bottom:none; }

        .setting-label { font-size:14px; font-weight:500; }
        .setting-desc { font-size:12px; opacity:.6; }

        .time-box {
          margin-top:12px;
          background:#f1f5f9;
          padding:14px;
          border-radius:8px;
          border:1px solid #e2e8f0;
        }

        .time-row { display:flex; justify-content:space-between; margin-bottom:12px; }
        .elapsed { font-size:22px; font-weight:600; }
        .estimated { font-size:18px; }

        .track-btn {
          width:100%; padding:12px; background:#2ec4b6;
          color:white; border:none; border-radius:6px;
          margin-bottom:10px; font-weight:600;
        }

        .reset-btn {
          width:100%; padding:10px; background:#b23838;
          color:white; border:none; border-radius:6px;
          margin-bottom:10px; font-weight:600;
        }

        .auto-row { display:flex; justify-content:space-between; margin-top:6px; }

        .toggle input { display:none; }
        .toggle-slider {
          width:44px; height:24px; background:#ccc;
          border-radius:12px; position:relative;
        }
        .toggle-slider::after {
          content:""; width:20px; height:20px;
          background:white; border-radius:50%;
          position:absolute; top:2px; left:2px;
          transition:.25s;
        }
        input:checked + .toggle-slider { background:#2ec4b6; }
        input:checked + .toggle-slider::after { transform:translateX(20px); }

        .unauthorized-title { color:#ff6b6b; margin-bottom:6px; }
        .remove-btn {
          width:100%; padding:12px; border:2px solid #ff6b6b;
          color:#ff6b6b; background:transparent; border-radius:6px;
          font-weight:600; cursor:pointer;
        }
      `}</style>

    </div>
  );
}


export default Settings;