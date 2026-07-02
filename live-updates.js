const PICKS=window.JAI_BRACKET||[],TEAMS=window.JAI_TEAMS||[],ROUND={r32:"Round of 32",r16:"Round of 16",qf:"Quarterfinals",sf:"Semifinals",final:"Final"};const AL={usa:"united states","united states of america":"united states","côte d’ivoire":"ivory coast","côte d'ivoire":"ivory coast","cote divoire":"ivory coast","congo dr":"dr congo","bosnia-herzegovina":"bosnia and herzegovina","bosnia & herzegovina":"bosnia and herzegovina"};function norm(x){let n=String(x||"").toLowerCase().replace(/&/g,"and").replace(/[’']/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();return AL[n]||n}function same(a,b){return norm(a)===norm(b)}function key(a,b){return[norm(a),norm(b)].sort().join("|")}function finished(m){return["FINISHED","FINISHED_EXTRA_TIME","FINISHED_PENALTY_SHOOTOUT","AWARDED"].includes(String(m.status||"").toUpperCase())||(m.homeScore!==null&&m.awayScore!==null&&m.winner)}function winnerOf(m){if(m.winner&&m.winner!=="Draw")return m.winner;if(typeof m.homeScore==="number"&&typeof m.awayScore==="number"){if(m.homeScore>m.awayScore)return m.homeTeam;if(m.awayScore>m.homeScore)return m.awayTeam}return null}function slug(x){return String(x||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}function el(id){return document.getElementById(id)}function set(id,t){const x=el(id);if(x)x.textContent=t}function link(name){return`<a class="teamInline" href="#team-${slug(name)}">${name}</a>`}function calc(matches){const map=new Map;matches.forEach(m=>map.set(key(m.homeTeam,m.awayTeam),m));let correct=0,wrong=0,judged=0,championAlive=true,finalistAlive=true;const results={};for(const p of PICKS){const m=map.get(key(p.a,p.b));let r={status:"pending"};if(m&&finished(m)){const w=winnerOf(m),ok=w&&same(w,p.pick);r={status:ok?"correct":"wrong",actual:w,score:m.scoreText,match:m};judged++;ok?correct++:wrong++}results[p.id]=r;if(p.championPath&&r.status==="wrong")championAlive=false;if(p.finalistPath&&r.status==="wrong")finalistAlive=false}let percent=judged?Math.round(correct/judged*100):0,health=55+correct*5-wrong*9+(championAlive?15:-35)+(finalistAlive?8:-20);health=Math.max(0,Math.min(100,health));return{results,correct,wrong,judged,percent,health,championAlive,finalistAlive}}function renderBracket(s){const by={};PICKS.forEach(p=>(by[p.round]??=[]).push(p));let h='<div class="bracketGrid">';["r32","r16","qf","sf","final"].forEach(rd=>{h+=`<div class="bracketRound"><div class="roundTitle">${ROUND[rd]}</div>`;(by[rd]||[]).forEach(p=>{const r=s.results[p.id]||{status:"pending"},cls=r.status==="correct"?"correct":r.status==="wrong"?"wrong":(p.championPath||p.finalistPath||p.usaFocus||p.usaConflict)?"special":"alive";h+=`<div class="bracketMatch ${cls}"><div class="teamLine ${r.actual&&same(r.actual,p.a)?"winner":""}">${link(p.a)}</div><div class="teamLine ${r.actual&&same(r.actual,p.b)?"winner":""}">${link(p.b)}</div><div class="winnerBadge">Your pick: ${link(p.pick)}</div>${r.actual?`<div class="winnerBadge">Actual: ${link(r.actual)}</div>`:""}<span class="pill">${r.status==="correct"?"✅ Correct":r.status==="wrong"?"❌ Wrong":"⏳ Waiting"} • ${r.score||"Not final yet"}</span></div>`});h+="</div>"});h+="</div>";el("bracketBoard").innerHTML=h}function renderLive(matches){el("liveMatches").innerHTML=matches.slice().sort((a,b)=>new Date(a.utcDate||0)-new Date(b.utcDate||0)).map(m=>`<div class="row"><b>${m.homeTeam} vs ${m.awayTeam}</b><span>${m.scoreText||m.status}</span></div>`).join("")||"No matches returned."}function renderDamage(s){const wrongs=PICKS.filter(p=>s.results[p.id]?.status==="wrong"),rights=PICKS.filter(p=>s.results[p.id]?.status==="correct");el("damageReport").innerHTML=`<article class="card"><h3>Health</h3><div class="mega">${s.health}%</div><p>${s.health>=80?"Excellent":s.health>=60?"Good":s.health>=40?"Danger":"Disaster"}</p></article><article class="card"><h3>Correct</h3><div class="mega">${s.correct}</div><p>${rights.map(p=>p.pick).join(", ")||"None yet"}</p></article><article class="card"><h3>Wrong</h3><div class="mega">${s.wrong}</div><p>${wrongs.map(p=>p.pick).join(", ")||"None yet"}</p></article><article class="card full"><h3>What hurt most?</h3><p class="deepText">${wrongs.length?wrongs.map(p=>`${p.pick} failed in ${ROUND[p.round]}.`).join(" "):"No major bracket damage yet."}</p></article>`}function renderScoop(s){const helpers=PICKS.filter(p=>s.results[p.id]?.status==="correct").map(p=>p.pick),hurts=PICKS.filter(p=>s.results[p.id]?.status==="wrong").map(p=>p.pick);el("dailyScoop").innerHTML=`<article class="card big"><h3>What changed today?</h3><p class="deepText">Your bracket is ${s.percent}% on judged picks: ${s.correct}/${s.judged}. France is ${s.championAlive?"alive ✅":"damaged ❌"}.</p></article><article class="card"><h3>Helpers</h3><p>${helpers.join(", ")||"None yet."}</p></article><article class="card"><h3>Damage</h3><p>${hurts.join(", ")||"None yet."}</p></article><article class="card full"><h3>Tomorrow Watch</h3><p class="deepText">Watch France, Argentina, USA, Spain, England, Belgium, Brazil, and any team that changes your future matchups.</p></article>`}function renderTeams(){el("teamCloud").innerHTML=TEAMS.map(t=>`<a class="teamChip" href="#team-${t.id}">${t.name}<span>${t.role}</span></a>`).join("");el("teamPages").innerHTML=TEAMS.map(t=>`<section id="team-${t.id}" class="screen"><div class="backRow"><a class="homeBtn" href="#teams">← Teams</a><a class="homeBtn" href="#bracket">Bracket</a></div><h2>${t.name}</h2><div class="grid"><article class="card big"><h3>${t.role}</h3><p class="deepText">${t.overview}</p><p class="deepText">Watch goals, set pieces, cards, goalkeeper saves, and bracket ripple effects.</p></article></div></section>`).join("")}function special(s){el("franceHQ").innerHTML=`<article class="card big"><h3>Champion Path</h3><p class="deepText">France is ${s.championAlive?"alive ✅":"damaged ❌"}. Every France win is huge because France is your champion.</p></article><article class="card"><h3>Champion Bonus</h3><div class="mega">${s.championAlive?"+15":"-35"}</div></article>`;el("usaHQ").innerHTML=`<article class="card big"><h3>USA Focus</h3><p class="deepText">USA gets special coverage. Your bracket wants USA over Bosnia and Herzegovina, then Belgium over USA.</p></article>`}function home(s,matches){set("homeAccuracy",s.judged?`${s.percent}%`:"—");set("homeAccuracyText",s.judged?`${s.correct}/${s.judged} judged picks correct.`:"Waiting for completed picks.");set("homeHealth",`${s.health}%`);set("homeHealthText",s.health>=80?"Excellent":s.health>=60?"Good":s.health>=40?"Danger":"Disaster");const next=matches.find(m=>!finished(m)&&m.utcDate&&new Date(m.utcDate)>new Date);if(next){set("nextGame",`${next.homeTeam} vs ${next.awayTeam}`);set("nextGameText",new Date(next.utcDate).toLocaleString())}}async function load(){try{renderTeams();set("liveConnection","Connecting…");const res=await fetch("/api/live-scores",{cache:"no-store"}),data=await res.json();if(!res.ok||!data.ok)throw new Error(data.error||"Live API error");const matches=data.matches||[],s=calc(matches);set("liveConnection",`Connected. Loaded ${matches.length} matches.`);set("lastUpdated",new Date(data.updatedAt).toLocaleString());set("judgedPicks",s.judged?`${s.correct}/${s.judged} correct (${s.percent}%)`:"No completed picks.");renderLive(matches);renderBracket(s);renderDamage(s);renderScoop(s);special(s);home(s,matches)}catch(err){set("liveConnection","Live update failed: "+err.message)}}document.addEventListener("DOMContentLoaded",()=>{load();setInterval(load,180000)})

/* ===== Pregame Odds Add-On ===== */

window.PREGAME_TEAM_POWER = {
  "France": 96, "Argentina": 95, "Brazil": 94, "Spain": 93, "England": 91,
  "Portugal": 90, "Belgium": 87, "Netherlands": 87, "Germany": 86,
  "United States": 80, "Mexico": 79, "Croatia": 84, "Morocco": 82,
  "Colombia": 81, "Switzerland": 79, "Senegal": 78, "Japan": 78,
  "Canada": 76, "Norway": 77, "Paraguay": 75, "Sweden": 76,
  "Ecuador": 75, "Austria": 76, "Ghana": 74, "Egypt": 74,
  "DR Congo": 70, "Cape Verde": 68, "Bosnia and Herzegovina": 72,
  "Ivory Coast": 73, "South Africa": 68, "Australia": 73, "Algeria": 74
};

function pregameWinChance(a, b) {
  const pa = window.PREGAME_TEAM_POWER[a] || 70;
  const pb = window.PREGAME_TEAM_POWER[b] || 70;
  const chance = Math.round(50 + (pa - pb) * 1.7);
  return Math.max(8, Math.min(92, chance));
}

function renderPregameOdds(matches) {
  const box = document.getElementById("pregame-odds");
  if (!box) return;

  const games = matches
    .filter(m => !String(m.status || "").toUpperCase().includes("FINISHED"))
    .slice(0, 12);

  if (!games.length) {
    box.innerHTML = `<article class="card soccerCard"><h3>No Pregame Odds Yet</h3><p class="deepText">New odds will appear when upcoming matches load.</p></article>`;
    return;
  }

  box.innerHTML = games.map(m => {
    const home = pregameWinChance(m.homeTeam, m.awayTeam);
    const away = 100 - home;
    const label = Math.abs(home - away) < 20 ? "🔥 Upset danger" : "✅ Strong favorite";
const bracketPicks = {
  "canada|morocco": "Canada",
  "brazil|norway": "Brazil",
  "france|paraguay": "France",
  "argentina|capeverde": "Argentina",
  "bosniaandherzegovina|unitedstates": "United States",
  "mexico|england": "England",
  "spain|austria": "Spain",
  "portugal|croatia": "Portugal",
  "switzerland|algeria": "Switzerland",
  "australia|egypt": "Egypt",
  "colombia|ghana": "Colombia"
};

function oddsClean(x) {
  const map = {
    esp: "spain",
    aut: "austria",
    arg: "argentina",
    cpv: "capeverde",
    usa: "unitedstates",
    bih: "bosniaandherzegovina"
  };

  const raw = String(x || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return map[raw] || raw;
}

const pickKey = [oddsClean(m.homeTeam), oddsClean(m.awayTeam)].sort().join("|");
const jaiPick = bracketPicks[pickKey] || "No pick found";
    
    return `
      <article class="card soccerCard">
        <h3>${m.homeTeam} vs ${m.awayTeam}</h3>
        <p class="deepText">${m.utcDate ? new Date(m.utcDate).toLocaleString() : m.status}</p>
        <div class="row"><b>${m.homeTeam}</b><span>${home}%</span></div>
        <div class="row"><b>${m.awayTeam}</b><span>${away}%</span></div>
       <p class="pill">⭐ Jai's Pick: ${jaiPick}</p>
<p class="pill">${label}</p>
      </article>
    `;
  }).join("");
}

async function loadPregameOddsOnly() {
  try {
    const res = await fetch("/api/live-scores", { cache: "no-store" });
    const data = await res.json();
    renderPregameOdds(data.matches || []);
  } catch (err) {
    console.error("Pregame odds failed", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPregameOddsOnly();
  setInterval(loadPregameOddsOnly, 180000);
});
