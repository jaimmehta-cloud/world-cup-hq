const PICKS = [
  ["South Africa", "Canada", "Canada"],
  ["Germany", "Paraguay", "Germany"],
  ["France", "Sweden", "France"],
  ["Netherlands", "Morocco", "Netherlands"],
  ["Brazil", "Japan", "Brazil"],
  ["Ivory Coast", "Norway", "Norway"],
  ["Mexico", "Ecuador", "Mexico"],
  ["England", "DR Congo", "England"],
  ["Belgium", "Senegal", "Belgium"],
  ["United States", "Bosnia and Herzegovina", "United States"],
  ["Spain", "Austria", "Spain"],
  ["Portugal", "Croatia", "Portugal"],
  ["Switzerland", "Algeria", "Switzerland"],
  ["Australia", "Egypt", "Egypt"],
  ["Argentina", "Cape Verde", "Argentina"],
  ["Colombia", "Ghana", "Colombia"]
];

function clean(x) {
  return String(x || "")
    .toLowerCase()
    .replace("usa", "united states")
    .replace("côte d’ivoire", "ivory coast")
    .replace("côte d'ivoire", "ivory coast")
    .replace("congo dr", "dr congo")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function same(a, b) {
  return clean(a) === clean(b);
}

function winnerOf(m) {
  if (m.winner && m.winner !== "Draw") return m.winner;
  if (typeof m.homeScore === "number" && typeof m.awayScore === "number") {
    if (m.homeScore > m.awayScore) return m.homeTeam;
    if (m.awayScore > m.homeScore) return m.awayTeam;
  }
  return null;
}

function finished(m) {
  return String(m.status || "").toUpperCase().includes("FINISHED");
}

function key(a, b) {
  return [clean(a), clean(b)].sort().join("|");
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function updateBracket(matches) {
  const map = new Map();
  matches.forEach(m => map.set(key(m.homeTeam, m.awayTeam), m));

  let correct = 0;
  let wrong = 0;
  let judged = 0;

  PICKS.forEach(([a, b, pick]) => {
    const m = map.get(key(a, b));
    if (!m || !finished(m)) return;

    const winner = winnerOf(m);
    if (!winner) return;

    judged++;
    const isCorrect = same(winner, pick);
    if (isCorrect) correct++;
    else wrong++;

    document.querySelectorAll(".bracketMatch").forEach(card => {
      const text = card.textContent;
      if (text.includes(a) && text.includes(b)) {
        card.classList.remove("correct", "wrong", "alive", "special");
        card.classList.add(isCorrect ? "correct" : "wrong");

        const pill = card.querySelector(".pill");
        if (pill) {
          pill.textContent = isCorrect
            ? `✅ Correct • ${m.scoreText}`
            : `❌ Wrong • ${m.scoreText}`;
        }
      }
    });
  });

  const percent = judged ? Math.round((correct / judged) * 100) : 0;

  setText(
    "live-accuracy",
    judged
      ? `${percent}% — ${correct}/${judged} judged picks correct.`
      : "No completed bracket picks yet."
  );

  document.querySelectorAll("#accuracy .kpi").forEach(el => {
    el.textContent = judged ? `${percent}%` : el.textContent;
  });

  return { correct, wrong, judged, percent };
}

function renderMatches(matches) {
  const box = document.getElementById("live-matches");
  if (!box) return;

  box.innerHTML = matches
    .map(m => `
      <div class="row">
        <b>${m.homeTeam} vs ${m.awayTeam}</b>
        <span>${m.scoreText || m.status}</span>
      </div>
    `)
    .join("");
}

async function loadLiveScores() {
  try {
    setText("live-connection", "Connecting...");

    const res = await fetch("/api/live-scores", { cache: "no-store" });
    const data = await res.json();

    if (!data.ok) throw new Error(data.error || "Live score error");

    const matches = data.matches || [];
    renderMatches(matches);
    const stats = updateBracket(matches);

    setText("live-connection", `Connected. Loaded ${matches.length} matches.`);
    setText("live-updated", `Updated ${new Date().toLocaleTimeString()}.`);

    console.log("Bracket stats:", stats);
  } catch (err) {
    setText("live-connection", "Live update failed: " + err.message);
    setText("live-updated", "Check Vercel settings or API.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadLiveScores();
  setInterval(loadLiveScores, 180000);
});
