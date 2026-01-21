import React from "react";
import ReactDOM from "react-dom/client";

const t = window.TrelloPowerUp.iframe();

function ConfirmRestart() {
  function choose(restart) {
    t.closePopup({ restart });
  }

  return (
    <>
      <div className="wrap">
        <h2>Restart Timer?</h2>

        <p className="msg">
          This card was moved into a tracked list.
          <br />
          Do you want to restart the timer for this task?
        </p>

        <div className="btn-row">
          <button className="btn yes" onClick={() => choose(true)}>
            Yes
          </button>

          <button className="btn no" onClick={() => choose(false)}>
            No
          </button>
        </div>
      </div>

      {/* Inline CSS */}
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 20px;
        }

        .wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        h2 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .msg {
          font-size: 14px;
          line-height: 1.45;
          color: #444;
        }

        .btn-row {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .btn {
          flex: 1;
          padding: 10px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .yes {
          background: #2ec4b6;
          color: white;
        }

        .no {
          background: #e2e2e2;
          color: #333;
        }
      `}</style>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ConfirmRestart />);
