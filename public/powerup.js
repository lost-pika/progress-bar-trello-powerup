/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

function makeBar(pct) {
  const total = 10;
  const filled = Math.round((pct / 100) * total);
  return "█".repeat(filled) + "▒".repeat(total - filled);
}

function formatHM(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  return `${h}:${m}`;
}

function computeElapsed(data) {
  if (!data || !data.running || !data.startTime) return data?.elapsed || 0;
  return data.elapsed + Math.floor((Date.now() - data.startTime) / 1000);
}

TrelloPowerUp.initialize({
  "board-buttons": function (t) {
    return [
      {
        icon: ICON,
        text: "Progress",
        callback: function () {
          return t.popup({
            title: "Progress Settings",
            url: t.signUrl("./dist/settings.html"),
            height: 620,
          });
        },
      },
    ];
  },

  "card-back-section": function (t) {
    return {
      title: "Progress",
      icon: ICON,
      content: {
        type: "iframe",
        url: t.signUrl("./dist/card-progress.html"),
        height: 180,
      },
    };
  },

  "card-badges": function (t) {
    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "hideBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(([data, hideBadges, hideBars]) => {
      if (hideBadges) return [];
      if (!data) return [];

      const badges = [];

      if (data.focusMode) {
        badges.push({ text: "🎯 Focus ON", color: "red" });
      }

      if (typeof data.progress === "number") {
        const pct = Math.max(0, Math.min(100, data.progress));
        badges.push({
          text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
          color: "blue",
        });
      }

      badges.push({
        dynamic: () =>
          t.get("card", "shared").then((cd) => ({
            text: cd
              ? `⏱ ${formatHM(computeElapsed(cd))} | Est ${formatHM(
                  cd.estimated || 28800,
                )}`
              : "",
            color: "blue",
          })),
        refresh: 1000,
      });

      return badges;
    });
  },

  "card-detail-badges": function (t) {
    return Promise.all([
      t.get("card", "shared", "progress"),
      t.get("card", "shared", "focusMode"),
      t.get("board", "shared", "hideDetailBadges"),
      t.get("board", "shared", "hideProgressBars"),
    ]).then(([progress, focusMode, hideDetails, hideBars]) => {
      if (hideDetails) return [];

      const badges = [];

      if (focusMode) {
        badges.push({ title: "Focus", text: "🎯 Focus ON", color: "red" });
      }

      if (progress != null) {
        const pct = Math.max(0, Math.min(100, progress));
        badges.push({
          title: "Progress",
          text: hideBars ? pct + "%" : `${makeBar(pct)} ${pct}%`,
          color: "blue",
        });
      }

      return badges;
    });
  },

  "card-buttons": function (t) {
    return [
      {
        icon: ICON,
        text: "Open Card",
        callback: function () {
          return Promise.all([
            t.get("card", "shared"),
            t.get("board", "shared", "autoTrackMode"),
            t.card("id"),
          ]).then(([data, mode, card]) => {
            if ((mode === "open" || mode === "both") && !data?.running) {
              t.set("card", "shared", {
                ...data,
                running: true,
                startTime: Date.now(),
              });
            }

            return t.navigate({ url: `https://trello.com/c/${card.id}` });
          });
        },
      },
    ];
  },

  "card-moved": function (t, opts) {
    return Promise.all([
      t.get("card", "shared"),
      t.get("board", "shared", "autoTrackMode"),
      t.get("board", "shared", "autoTrackLists"),
    ]).then(([data, mode, lists]) => {
      if (!data) return;
      if (mode !== "list" && mode !== "both") return;
      if (!lists?.includes(opts.to.list)) return;

      if (!data.running) {
        return t.set("card", "shared", {
          ...data,
          running: true,
          startTime: Date.now(),
        });
      }

      return t
        .popup({
          title: "Restart Timer?",
          url: t.signUrl("./dist/confirm-restart.html"),
          height: 150,
          args: { cardData: data },
        })
        .then((result) => {
          if (!result?.restart) return;

          return t.set("card", "shared", {
            ...data,
            elapsed: 0,
            running: true,
            startTime: Date.now(),
          });
        });
    });
  },

  "authorization-status": (t) =>
    t.get("member", "private", "authorized").then((auth) => ({
      authorized: auth === true,
    })),

  "show-authorization": (t) =>
    t.popup({
      title: "Authorize Progress Power-Up",
      url: "./auth.html",
      height: 200,
    }),
});
