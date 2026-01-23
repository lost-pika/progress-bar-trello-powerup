/* global TrelloPowerUp */

var ICON = "https://cdn-icons-png.flaticon.com/512/992/992651.png";
var Promise = TrelloPowerUp.Promise;

/* ----------------------------------------
   HELPERS
---------------------------------------- */

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
  const now = Date.now();
  return data.elapsed + Math.floor((now - data.startTime) / 1000);
}

// ⭐ COMPLETELY REWRITTEN: Proper error handling from scratch
async function computeChecklistProgress(t) {
  try {
    // STEP 1: Wait for card to load with timeout
    let retries = 5;
    let card = null;

    while (retries > 0 && !card) {
      try {
        card = await t.card("all");
        if (card && card.checklists && Array.isArray(card.checklists)) {
          break; // Success, exit loop
        }
      } catch (err) {
        console.warn(`Retry ${6 - retries}: Card load failed`, err);
      }
      
      if (!card || !card.checklists) {
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 300)); // Wait 300ms
        }
      }
    }

    // STEP 2: Validate card exists
    if (!card) {
      console.warn("⚠️ Card data unavailable after retries");
      return 0;
    }

    // STEP 3: Validate checklists exist
    if (!card.checklists || card.checklists.length === 0) {
      console.log("ℹ️ No checklists on this card");
      return 0;
    }

    // STEP 4: Count items safely
    let total = 0;
    let done = 0;

    card.checklists.forEach((checklist) => {
      if (!checklist || !checklist.checkItems) return;
      
      checklist.checkItems.forEach((item) => {
        if (!item) return;
        
        total++;
        if (item.state === "complete") {
          done++;
        }
      });
    });

    // STEP 5: Calculate percentage
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    console.log(`✅ Progress: ${done}/${total} = ${pct}%`);
    return pct;

  } catch (err) {
    console.error("❌ CRITICAL ERROR in computeChecklistProgress:", err);
    console.error("Stack:", err.stack);
    return 0;
  }
}

/* ----------------------------------------
   INITIALIZE CARD DATA (if missing)
---------------------------------------- */

async function ensureCardDataExists(t) {
  try {
    let data = await t.get("card", "shared");
    
    // If no data exists, initialize it
    if (!data) {
      console.log("🔧 Initializing card data...");
      const initialPct = await computeChecklistProgress(t);
      
      data = {
        progress: initialPct,
        elapsed: 0,
        estimated: 8 * 3600,
        running: false,
        startTime: null,
        focusMode: false,
        disabledProgress: false,
      };
      
      await t.set("card", "shared", data);
      console.log("✅ Card data initialized:", data);
    }
    
    return data;
  } catch (err) {
    console.error("Error ensuring card data:", err);
    return null;
  }
}

/* ----------------------------------------
   INITIALIZE POWER-UP
---------------------------------------- */

TrelloPowerUp.initialize({
  /* Board Button → Settings popup */
  "board-buttons": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");

    if (disabled)
      return [
        {
          icon: ICON,
          text: "Progress",
          callback: function (t, opts) {
            return t.popup({
              title: "Authorize power up",
              url: "./auth.html",
              height: 200,
              mouseEvent: opts.mouseEvent,
            });
          },
        },
      ];

    return [
      {
        icon: ICON,
        text: "Progress",
        callback: function (t, opts) {
          return t.popup({
            title: "Progress Settings",
            url: "./settings.html",
            height: 620,
            mouseEvent: opts.mouseEvent,
          });
        },
      },
    ];
  },

  /* Card Back Section → Timer iframe */
  "card-back-section": async function (t) {
    const disabled = await t.get("board", "shared", "disabled");
    if (disabled) return null;

    const cardData = await t.get("card", "shared");
    if (!cardData || cardData.disabledProgress === true) return null;

    return {
      title: "Progress",
      icon: ICON,
      content: {
        type: "iframe",
        url: t.signUrl("./card-progress.html"),
        height: 180,
      },
    };
  },

  /* Card Badges → Timer + Progress + Focus */
  "card-badges": async function (t) {
    try {
      const disabled = await t.get("board", "shared", "disabled");
      if (disabled) return [];

      // ⭐ ENSURE DATA EXISTS FIRST
      const data = await ensureCardDataExists(t);
      if (!data) return [];

      const [hideBadges, hideBars, hideTimer] = await Promise.all([
        t.get("board", "shared", "hideBadges"),
        t.get("board", "shared", "hideProgressBars"),
        t.get("board", "shared", "hideTimerBadges"),
      ]);

      if (hideBadges || data.disabledProgress) return [];

      const badges = [];

      // Focus badge
      if (data.focusMode) {
        badges.push({
          text: "🎯 Focus",
          color: "red",
        });
      }

      // ⭐ PROGRESS BADGE: Compute fresh from checklists
      badges.push({
        text: hideBars 
          ? (data.progress || 0) + "%" 
          : `${makeBar(data.progress || 0)} ${data.progress || 0}%`,
        color: "blue",
        dynamic: function (t) {
          return computeChecklistProgress(t).then(async (freshPct) => {
            // Only update if changed
            const currentData = await t.get("card", "shared");
            if (currentData && currentData.progress !== freshPct) {
              await t.set("card", "shared", "progress", freshPct);
            }

            return {
              text: hideBars ? freshPct + "%" : `${makeBar(freshPct)} ${freshPct}%`,
              color: "blue",
            };
          }).catch(err => {
            console.error("Badge dynamic error:", err);
            return {
              text: hideBars 
                ? (data.progress || 0) + "%" 
                : `${makeBar(data.progress || 0)} ${data.progress || 0}%`,
              color: "blue",
            };
          });
        },
        refresh: 500, // Check every 500ms
      });

      // Timer badge
      if (!hideTimer) {
        badges.push({
          dynamic: function (t) {
            return t.get("card", "shared").then((d) => {
              if (!d) return { text: "" };
              const el = computeElapsed(d);
              const est = d.estimated || 8 * 3600;
              return {
                text: `⏱ ${formatHM(el)} | Est ${formatHM(est)}`,
                color: "blue",
              };
            });
          },
          refresh: 1000,
        });
      }

      return badges;
    } catch (err) {
      console.error("❌ card-badges error:", err);
      return [];
    }
  },

  /* Inside card detail view */
  "card-detail-badges": async function (t) {
    try {
      const disabled = await t.get("board", "shared", "disabled");
      if (disabled) return [];

      // ⭐ ENSURE DATA EXISTS FIRST
      const data = await ensureCardDataExists(t);
      if (!data) return [];

      const [hideDetail, hideBars, hideTimer] = await Promise.all([
        t.get("board", "shared", "hideDetailBadges"),
        t.get("board", "shared", "hideProgressBars"),
        t.get("board", "shared", "hideTimerBadges"),
      ]);

      if (hideDetail || data.disabledProgress) return [];

      const badges = [];

      if (data.focusMode) {
        badges.push({
          title: "Focus",
          text: "🎯 Focus ON",
          color: "red",
        });
      }

      // ⭐ PROGRESS BADGE (Detail View)
      badges.push({
        title: "Progress",
        text: hideBars 
          ? (data.progress || 0) + "%" 
          : `${makeBar(data.progress || 0)} ${data.progress || 0}%`,
        color: "blue",
        dynamic: function (t) {
          return computeChecklistProgress(t).then(async (freshPct) => {
            const currentData = await t.get("card", "shared");
            if (currentData && currentData.progress !== freshPct) {
              await t.set("card", "shared", "progress", freshPct);
            }

            return {
              text: hideBars ? freshPct + "%" : `${makeBar(freshPct)} ${freshPct}%`,
              color: "blue",
            };
          }).catch(err => {
            console.error("Detail badge error:", err);
            return {
              text: hideBars 
                ? (data.progress || 0) + "%" 
                : `${makeBar(data.progress || 0)} ${data.progress || 0}%`,
              color: "blue",
            };
          });
        },
        refresh: 500,
      });

      if (!hideTimer) {
        badges.push({
          title: "Timer",
          dynamic: function (t) {
            return t.get("card", "shared").then((d) => {
              if (!d) return { text: "" };
              const el = computeElapsed(d);
              const est = d.estimated || 8 * 3600;
              return {
                text: `⏱ ${formatHM(el)} | Est ${formatHM(est)}`,
                color: "blue",
              };
            });
          },
          refresh: 1000,
        });
      }

      return badges;
    } catch (err) {
      console.error("❌ card-detail-badges error:", err);
      return [];
    }
  },

  "card-buttons": async function (t, opts) {
    try {
      const data = await ensureCardDataExists(t);
      if (!data) return [];

      const isHidden = data.disabledProgress === true;

      return [
        {
          icon: ICON,
          text: isHidden ? "Add Progress" : "Hide Progress",
          callback: function (t) {
            return ensureCardDataExists(t).then((currentData) => {
              if (!isHidden) {
                return t.set("card", "shared", "disabledProgress", true).then(() => t.refresh());
              }

              return t.set("card", "shared", "disabledProgress", false).then(() => t.refresh());
            });
          },
        },
      ];
    } catch (err) {
      console.error("❌ card-buttons error:", err);
      return [];
    }
  },

  /* Auto-track on list move */
  "card-moved": function (t, opts) {
    return Promise.all([
      ensureCardDataExists(t),
      t.get("board", "shared", "autoTrackMode"),
      t.get("board", "shared", "autoTrackLists"),
    ]).then(([data, mode, lists]) => {
      if (!data) return;
      if (mode !== "list" && mode !== "both") return;
      if (!lists || lists.length === 0) return;

      const destListId = opts.to.list.id;
      if (!lists.includes(destListId)) return;

      if (!data.running) {
        return t
          .set("card", "shared", {
            ...data,
            running: true,
            startTime: Date.now(),
            focusMode: true,
          })
          .then(() => t.refresh());
      }

      return t
        .popup({
          title: "Restart Timer?",
          url: "./confirm-restart.html",
          height: 150,
          args: { cardData: data },
        })
        .then((result) => {
          if (!result || result.restart !== true) return;

          return t
            .set("card", "shared", {
              ...data,
              elapsed: 0,
              running: true,
              startTime: Date.now(),
              focusMode: true,
            })
            .then(() => t.refresh());
        });
    });
  },

  /* Auth */
  "authorization-status": function (t) {
    return t
      .get("member", "private", "authorized")
      .then((a) => ({ authorized: a === true }));
  },

  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize Progress Power-Up",
      url: "./auth.html",
      height: 200,
    });
  },
});