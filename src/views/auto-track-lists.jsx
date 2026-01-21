import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

const t = window.TrelloPowerUp.iframe();

function AutoTrackLists() {
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState([]);

  // Load board lists + saved selections
  useEffect(() => {
    async function load() {
      const saved =
        (await t.get("board", "shared", "autoTrackLists")) || [];

      const board = await t.board("lists");

      setSelected(saved);
      setLists(board.lists);
    }

    load();
  }, []);

  // Toggle checkbox
  function toggle(name) {
    setSelected((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  }

  // Save & close
  async function saveAndClose() {
    await t.set("board", "shared", "autoTrackLists", selected);
    t.closePopup();
  }

  return (
    <>
      <div className="wrap">
        <h2>Select Lists for Auto Tracking</h2>

        <div className="list-container">
          {lists.map((lst) => (
            <label key={lst.id} className="list-item">
              <input
                type="checkbox"
                checked={selected.includes(lst.name)}
                onChange={() => toggle(lst.name)}
              />
              <span>{lst.name}</span>
            </label>
          ))}
        </div>

        <button className="save-btn" onClick={saveAndClose}>
          Save & Close
        </button>
      </div>

      {/* Inline styles */}
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 16px;
        }

        .wrap {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        h2 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .list-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }

        .list-item {
          display: flex;
          align-items: center;
          font-size: 14px;
          gap: 10px;
          cursor: pointer;
        }

        .list-item input {
          width: 16px;
          height: 16px;
        }

        .save-btn {
          width: 100%;
          margin-top: 16px;
          padding: 10px;
          border-radius: 6px;
          background: #2ec4b6;
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}

export default AutoTrackLists;
