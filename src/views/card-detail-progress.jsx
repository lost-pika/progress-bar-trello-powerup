import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

const t = window.TrelloPowerUp.iframe();

function format(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function CardDetailProgress() {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [estimated, setEstimated] = useState(8 * 3600);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [auto, setAuto] = useState(false);
  const [hideProgressBars, setHideProgressBars] = useState(false);

  // Live tick
  useEffect(() => {
    let interval = null;

    if (running) {
      interval = setInterval(() => {
        const live =
          elapsed + Math.floor((Date.now() - startTime) / 1000);
        setElapsed((prev) => prev); // trigger re-render
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [running, startTime]);

  // Load state
  useEffect(() => {
    async function load() {
      const data = await t.get("card", "shared");
      const hide = await t.get("board", "shared", "hideProgressBars");

      setProgress(data?.progress || 0);
      setElapsed(data?.elapsed || 0);
      setEstimated(data?.estimated || 8 * 3600);
      setRunning(data?.running || false);
      setStartTime(data?.startTime || null);
      setAuto(data?.auto || false);
      setHideProgressBars(hide || false);

      setTimeout(() => t.sizeTo(document.body).done(), 40);
    }

    load();
  }, []);

  function save(stateOverride = {}) {
    t.set("card", "shared", {
      progress,
      elapsed,
      estimated,
      running,
      startTime,
      auto,
      hideProgressBars,
      ...stateOverride,
    });
  }

  function toggleTimer() {
    if (running) {
      const now = Date.now();
      const total = elapsed + Math.floor((now - startTime) / 1000);
      setElapsed(total);
      setRunning(false);
      setStartTime(null);
      save({ elapsed: total, running: false, startTime: null });
    } else {
      setRunning(true);
      setStartTime(Date.now());
      save({ running: true, startTime: Date.now() });
    }
  }

  function resetTimer() {
    setElapsed(0);
    setRunning(false);
    setStartTime(null);
    save({ elapsed: 0, running: false, startTime: null });
  }

  const liveElapsed =
    running && startTime
      ? elapsed + Math.floor((Date.now() - startTime) / 1000)
      : elapsed;

  const behind = liveElapsed > estimated;

  return (
    <>
      <div className="container">
        <div className="header">
          <div className="title">⚡ Progress</div>
          <div className="percent">{progress}%</div>
        </div>

        {/* Progress Bar */}
        {!hideProgressBars && (
          <div className="progress-section">
            <div className="bar-bg">
              <div
                className="bar-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="manual-progress">
              <span>Progress: {progress}%</span>
            </div>
          </div>
        )}

        {/* Time Box */}
        <div className="time-box">
          <div className="time-row">
            <div>
              <div style={{ opacity: 0.6, fontSize: 12 }}>Elapsed</div>
              <div id="elapsed" className="elapsed">
                {format(liveElapsed)}
              </div>
            </div>

            <div>
              <div
                style={{ opacity: 0.6, fontSize: 12, textAlign: "right" }}
              >
                Estimated
              </div>
              <div className="estimated">{format(estimated)}</div>
            </div>
          </div>

          {behind && (
            <div className="status-warning">⚠ Behind schedule</div>
          )}

          <button className="track-btn" onClick={toggleTimer}>
            {running ? "⏸ Stop Tracking" : "▶ Start Tracking"}
          </button>

          <button className="reset-btn" onClick={resetTimer}>Reset</button>

          <div className="auto-row">
            <span>Enable automatic tracking</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => {
                  setAuto(e.target.checked);
                  save({ auto: e.target.checked });
                }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Existing CSS copied exactly */}
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #e0e0e0;
          padding: 4px 10px;
        }
        .container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .title {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .percent {
          font-size: 14px;
          font-weight: 600;
          color: #2ec4b6;
        }
        .progress-section.hidden { display: none; }
        .bar-bg {
          width: 100%;
          height: 8px;
          border-radius: 5px;
          background: rgba(46,196,182,0.18);
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: #2ec4b6;
          transition: width .25s ease;
        }
        .label { font-size: 13px; color: #b0b0b0; margin-top: 4px; }
        .manual-progress {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 13px;
        }
        .time-box {
          padding: 14px 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .time-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .elapsed {
          font-size: 20px;
          font-weight: 600;
          color: #38e1d3;
        }
        .estimated { font-size: 16px; color: #fff; }
        .status-warning {
          margin: 6px 0 10px 0;
          padding: 8px 12px;
          background: rgba(255,189,67,0.16);
          border-left: 3px solid #ffb84a;
          color: #ffcb7a;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
        }
        .track-btn {
          width: 100%;
          padding: 12px;
          background: #2ec4b6;
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 8px;
        }
        .reset-btn {
          width: 100%;
          background: #b23838;
          color: white;
          padding: 10px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 13px;
          margin-bottom: 14px;
        }
        .auto-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          width: 100%;
          gap: 12px;
        }
        .toggle { display: inline-flex; align-items: center; cursor: pointer; }
        .toggle input { display: none; }
        .toggle-slider {
          width: 40px;
          height: 20px;
          background: rgba(255,255,255,0.2);
          border-radius: 20px;
          position: relative;
          transition: .25s ease;
        }
        .toggle-slider::after {
          content: "";
          width: 16px;
          height: 16px;
          background: #fff;
          position: absolute;
          top: 2px;
          left: 2px;
          border-radius: 50%;
          transition: .25s ease;
        }
        input:checked + .toggle-slider {
          background: #2ec4b6 !important;
        }
        input:checked + .toggle-slider::after {
          transform: translateX(20px);
        }
      `}</style>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <CardDetailProgress />
);
