<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://p.trellocdn.com/power-up.min.js"></script>

    <style>
      /* 🎨 CSS VARIABLES FOR THEMING */
      :root {
        /* Default (Dark Mode) */
        --bg-panel: rgba(255, 255, 255, 0.05);
        --border-panel: rgba(255, 255, 255, 0.1);
        --text-main: #e0e0e0;
        --text-muted: rgba(255, 255, 255, 0.5);
        --primary: #2ec4b6;
        --btn-hover-bg: rgba(255, 255, 255, 0.1);
        --toggle-bg: rgba(0, 0, 0, 0.4);
        --toggle-knob: #b0b0b0;
        --warning-bg: rgba(255, 189, 67, 0.15);
        --warning-text: #ffcb7a;
        --warning-border: #ffb84a;
      }

      /* ☀️ Light Mode Overrides */
      body.light-theme {
        --bg-panel: #f4f5f7; /* Trello Light Gray */
        --border-panel: #dfe1e6;
        --text-main: #172b4d; /* Trello Dark Blue */
        --text-muted: #5e6c84;
        --primary: #0079bf; /* Trello Blue */
        --btn-hover-bg: rgba(9, 30, 66, 0.08);
        --toggle-bg: rgba(9, 30, 66, 0.1);
        --toggle-knob: #ffffff;
        --warning-bg: #fff7d6;
        --warning-text: #976700;
        --warning-border: #ffab00;
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        background: transparent; /* ✅ Transparent background */
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--text-main);
        padding: 0 4px;
      }

      .compact-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }

      .time-panel {
        background: var(--bg-panel); /* Uses variable */
        border: 1px solid var(--border-panel);
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .stats-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }

      .stat-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        color: var(--text-muted);
      }

      .elapsed-time {
        font-family: "SF Mono", "Monaco", monospace;
        font-variant-numeric: tabular-nums;
        font-size: 22px;
        font-weight: 700;
        color: var(--primary);
        line-height: 1.1;
      }

      .estimated-input {
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-main);
        font-family: "SF Mono", "Monaco", monospace;
        font-size: 14px;
        width: 70px;
        padding: 2px 4px;
        border-radius: 4px;
        text-align: right;
        transition: 0.2s;
      }
      .estimated-input:hover { background: var(--btn-hover-bg); }
      .estimated-input:focus {
        background: var(--btn-hover-bg);
        border-color: var(--primary);
        outline: none;
      }

      .controls-row { display: flex; gap: 8px; height: 44px; }

      .btn-toggle {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: var(--btn-hover-bg);
        border: 1px solid var(--border-panel);
        border-radius: 8px;
        cursor: pointer;
        color: var(--text-main);
        font-size: 14px;
        font-weight: 700;
        transition: all 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .btn-toggle:hover { border-color: var(--primary); }

      .btn-toggle.active {
        background: rgba(46, 196, 182, 0.15);
        border-color: var(--primary);
        color: var(--primary);
      }
      /* Light mode specific override for active state */
      body.light-theme .btn-toggle.active {
        background: #e6fcff;
        color: #0079bf;
      }

      .toggle-switch {
        width: 38px; height: 22px;
        background: var(--toggle-bg);
        border-radius: 20px;
        position: relative;
        transition: 0.3s ease;
        flex-shrink: 0;
        border: 1px solid var(--border-panel);
      }

      .toggle-switch::after {
        content: ""; position: absolute; top: 2px; left: 2px;
        width: 16px; height: 16px;
        background: var(--toggle-knob);
        border-radius: 50%;
        transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .btn-toggle.active .toggle-switch { background: var(--primary); }
      .btn-toggle.active .toggle-switch::after {
        transform: translateX(16px);
        background: #ffffff;
      }

      .btn-reset {
        width: 44px;
        background: #b23838;
        border: none; border-radius: 8px;
        cursor: pointer; color: white;
        display: flex; align-items: center; justify-content: center;
        transition: 0.2s;
      }
      .btn-reset:hover { filter: brightness(1.1); }
      .icon-svg { width: 20px; height: 20px; fill: currentColor; }

      .status-warning {
        font-size: 11px;
        background: var(--warning-bg);
        border-left: 2px solid var(--warning-border);
        color: var(--warning-text);
        padding: 6px 10px;
        margin-top: -6px;
        border-radius: 0 4px 4px 0;
      }
    </style>
  </head>

  <body>
    <div id="root"></div>

    <script src="./card-progress.js"></script>
    <script>
      const t_theme = TrelloPowerUp.iframe();
      if (t_theme.getContext().theme === 'light') {
        document.body.classList.add('light-theme');
      }
    </script>
  </body>
</html>