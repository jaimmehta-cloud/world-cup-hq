// Live updater for Jai's bracket. Keeps your bracket picks in the site, then updates labels from /api/live-scores.

const JAI_PICKS = [
  { a: "Canada", b: "South Africa", pick: "Canada" },
  { a: "Germany", b: "Paraguay", pick: "Germany" },
  { a: "France", b: "Sweden", pick: "France" },
  { a: "Netherlands", b: "Morocco", pick: "Netherlands" },
  { a: "Brazil", b: "Japan", pick: "Brazil" },
  { a: "Norway", b: "Ivory Coast", pick: "Norway" },
  { a: "Mexico", b: "Ecuador", pick: "Mexico" },
  { a: "England", b: "DR Congo", pick: "England" },
  { a: "Spain", b: "Austria", pick: "Spain" },
  { a: "United States", b: "Bosnia and Herzegovina", pick: "United States" },
  { a: "Belgium", b: "Senegal", pick: "Belgium" },
  { a: "Egypt", b: "Australia", pick: "Egypt" },
  { a: "Switzerland", b: "Algeria", pick: "Switzerland" },
  { a: "Colombia", b: "Ghana", pick: "Colombia" },
  { a: "Argentina", b: "Cape Verde", pick: "Argentina" },
  { a: "Portugal", b: "Croatia", pick: "Portugal" }
];

const NAME_ALIASES = {
  "usa": "united states",
  "united states of america": "united states",
  "côte d'ivoire": "ivory coast",
  "cote d'ivoire": "ivory coast",
  "congo dr": "dr congo",
  "bosnia-herzegovina": "bosnia and herzegovina",
  "bosnia & herzegovina": "bosnia and herzegovina",
  "bosnia-herz": "bosnia and herzegovina",
  "czech republic": "czechia"
};

function norm(name) {
  const n = String(name || "").toLowerCase().replace(/&/g, "and").replace(/[().,]/g, "").replace(/\s+/g, " ").trim();
  return NAME_ALIASES[n] || n;
}
function sameTeam(a, b) { return norm(a) === norm(b); }
function matchKey(a, b) { return [norm(a), norm(b)].sort().join(" | "); }
function isFinished(status) { return ["FINISHED", "FINISHED_EXTRA_TIME", "FINISHED_PENALTY_SHOOTOUT", "AWARDED"].includes(String(status || "").toUpperCase()); }
function getWinner(m) {
  if (m.winner && m.winner !== "Draw") return m.winner;
  if (typeof m.homeScore === "number" && typeof m.awayScore === "number") {
    if (m.homeScore > m.awayScore) return m.homeTeam;
    if (m.awayScore > m.homeScore) return m.awayTeam;
  }
  return null;
}
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

function renderLiveMatches(matches) {
  const el = document.getElementById("live-matches");
  if (!el) return;
  const rows = matches.slice().sort((a,b) => new Date(a.utcDate || 0) - new Date(b.utcDate || 0)).map((m) => {
    const date = m.utcDate ? new Date(m.utcDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "";
    return `<div class="row"><b>${m.homeTeam} vs ${m.awayTeam}</b><span>${m.scoreText || m.status} • ${date}</span></div>`;
  }).join("");
  el.innerHTML = rows || "No World Cup matches returned yet.";
}

function calculateAccuracy(matches) {
  const byKey = new Map();
  for (const m of matches) byKey.set(matchKey(m.homeTeam, m.awayTeam), m);
  let correct = 0, wrong = 0, judged = 0;
  for (const pick of JAI_PICKS) {
    const m = byKey.get(matchKey(pick.a, pick.b));
    if (!m || !isFinished(m.status)) continue;
    const winner = getWinner(m);
    if (!winner) continue;
    judged += 1;
    if (sameTeam(winner, pick.pick)) correct += 1;
    else wrong += 1;
  }
  return { correct, wrong, judged, percent: judged ? Math.round((correct / judged) * 100) : 0, byKey };
}

function updateAccuracyUI(stats) {
  const text = stats.judged ? `Live accuracy: ${stats.percent}% — ${stats.correct}/${stats.judged} judged picks correct.` : "No judged World Cup picks returned yet.";
  setText("live-accuracy", text);
  document.querySelectorAll("#accuracy .kpi, #accuracy .megaNumber").forEach((el) => {
    if (stats.judged) el.textContent = `${stats.percent}%`;
  });
  document.querySelectorAll("#accuracy .deepText").forEach((el) => {
    if (el.textContent.includes("correct") || el.textContent.includes("judged")) {
      el.textContent = text + " Unplayed picks stay alive and are not counted yet.";
    }
  });
}

function updateBracketLabels(stats) {
  document.querySelectorAll(".bracketMatch").forEach((box) => {
    const lines = [...box.querySelectorAll(".teamLine")].map((x) => x.textContent.trim());
    if (lines.length < 2) return;
    const pickEl = box.querySelector(".winnerBadge");
    const pill = box.querySelector(".pill");
    if (!pickEl || !pill) return;
    const pickText = pickEl.textContent.replace(/^Pick:\s*/i, "").trim();
    const m = stats.byKey.get(matchKey(lines[0], lines[1]));
    if (!m || !isFinished(m.status)) return;
    const winner = getWinner(m);
    if (!winner) return;
    const ok = sameTeam(winner, pickText);
    box.classList.remove("correct", "wrong", "alive", "special");
    box.classList.add(ok ? "correct" : "wrong");
    pill.textContent = ok ? `✅ Correct • ${m.scoreText}` : `❌ Wrong • ${m.scoreText}`;
  });
}

async function loadLiveScores() {
  setText("live-connection", "Connecting to /api/live-scores…");
  try {
    const res = await fetch("/api/live-scores", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || `Live API returned ${res.status}`);
    const matches = Array.isArray(data.matches) ? data.matches : [];
    const stats = calculateAccuracy(matches);
    setText("live-connection", `Connected. Loaded ${matches.length} World Cup matches.`);
    setText("live-updated", `Last updated: ${new Date(data.updatedAt).toLocaleString()}`);
    renderLiveMatches(matches);
    updateAccuracyUI(stats);
    updateBracketLabels(stats);
  } catch (err) {
    console.error(err);
    setText("live-connection", `Live update failed: ${err.message}`);
    setText("live-updated", "Check Vercel Environment Variables and redeploy.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadLiveScores();
  setInterval(loadLiveScores, 3 * 60 * 1000);
});
