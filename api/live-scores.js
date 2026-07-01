// Vercel serverless function: /api/live-scores
// Uses FOOTBALL_DATA_API_KEY from Vercel Environment Variables.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");

  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) {
    return res.status(500).json({ ok: false, error: "Missing FOOTBALL_DATA_API_KEY in Vercel Environment Variables." });
  }

  const endpoints = [
    "https://api.football-data.org/v4/competitions/WC/matches",
    "https://api.football-data.org/v4/matches?competitions=WC"
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const upstream = await fetch(endpoint, {
        headers: { "X-Auth-Token": token, "Accept": "application/json" }
      });
      const text = await upstream.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (!upstream.ok) {
        lastError = { status: upstream.status, statusText: upstream.statusText, body: data };
        continue;
      }
      const matches = Array.isArray(data.matches) ? data.matches : [];
      const simplified = matches.map((m) => {
        const full = m.score?.fullTime || {};
        const regular = m.score?.regularTime || {};
        const homeScore = full.home ?? regular.home ?? null;
        const awayScore = full.away ?? regular.away ?? null;
        const homeName = m.homeTeam?.name || m.homeTeam?.shortName || "Home";
        const awayName = m.awayTeam?.name || m.awayTeam?.shortName || "Away";
        let winner = null;
        if (m.score?.winner === "HOME_TEAM") winner = homeName;
        if (m.score?.winner === "AWAY_TEAM") winner = awayName;
        if (m.score?.winner === "DRAW") winner = "Draw";
        return {
          id: m.id,
          utcDate: m.utcDate,
          status: m.status,
          matchday: m.matchday,
          stage: m.stage,
          group: m.group,
          homeTeam: homeName,
          awayTeam: awayName,
          homeScore,
          awayScore,
          winner,
          scoreText: homeScore === null || awayScore === null ? m.status : `${homeName} ${homeScore}–${awayScore} ${awayName}`
        };
      });
      return res.status(200).json({ ok: true, source: endpoint, count: simplified.length, updatedAt: new Date().toISOString(), matches: simplified });
    } catch (err) {
      lastError = { message: err.message };
    }
  }
  return res.status(502).json({ ok: false, error: "Could not fetch football-data.org World Cup matches.", details: lastError });
}
