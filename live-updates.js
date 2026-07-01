/* ==========================================================
   WORLD CUP HQ LIVE ENGINE v2
   PART 1A
========================================================== */

const PICKS = [
  ["South Africa","Canada","Canada"],
  ["Germany","Paraguay","Germany"],
  ["France","Sweden","France"],
  ["Netherlands","Morocco","Netherlands"],
  ["Brazil","Japan","Brazil"],
  ["Ivory Coast","Norway","Norway"],
  ["Mexico","Ecuador","Mexico"],
  ["England","DR Congo","England"],
  ["Belgium","Senegal","Belgium"],
  ["United States","Bosnia and Herzegovina","United States"],
  ["Spain","Austria","Spain"],
  ["Portugal","Croatia","Portugal"],
  ["Switzerland","Algeria","Switzerland"],
  ["Australia","Egypt","Egypt"],
  ["Argentina","Cape Verde","Argentina"],
  ["Colombia","Ghana","Colombia"]
];

function clean(x){
  return String(x||"")
    .toLowerCase()
    .replace("usa","united states")
    .replace("côte d’ivoire","ivory coast")
    .replace("côte d'ivoire","ivory coast")
    .replace("congo dr","dr congo")
    .replace(/[^a-z0-9 ]/g,"")
    .trim();
}

function same(a,b){
  return clean(a)===clean(b);
}

function key(a,b){
  return [clean(a),clean(b)].sort().join("|");
}

function finished(m){
  return String(m.status||"").toUpperCase().includes("FINISHED");
}

function winnerOf(m){

  if(m.winner && m.winner!=="Draw")
    return m.winner;

  if(typeof m.homeScore==="number" &&
     typeof m.awayScore==="number"){

      if(m.homeScore>m.awayScore)
        return m.homeTeam;

      if(m.awayScore>m.homeScore)
        return m.awayTeam;
  }

  return null;

}

function setText(id,text){

 const el=document.getElementById(id);

 if(el)
   el.textContent=text;

}

function setHTML(id,html){

 const el=document.getElementById(id);

 if(el)
   el.innerHTML=html;

}

function card(title,body){

 return `
 <article class="card soccerCard">
    <h3>${title}</h3>
    <p class="deepText">${body}</p>
 </article>
 `;

}

function renderMatches(matches){

 const box=document.getElementById("live-matches");

 if(!box) return;

 box.innerHTML=matches.map(m=>`

<div class="row">
   <b>${m.homeTeam} vs ${m.awayTeam}</b>
   <span>${m.scoreText||m.status}</span>
</div>

`).join("");

}

function updateBracket(matches){

 const map=new Map();

 matches.forEach(m=>{

   map.set(
      key(m.homeTeam,m.awayTeam),
      m
   );

 });

 let judged=0;
 let correct=0;
 let wrong=0;

 PICKS.forEach(([a,b,pick])=>{

   const match=map.get(key(a,b));

   if(!match) return;

   if(!finished(match)) return;

   const winner=winnerOf(match);

   if(!winner) return;

   judged++;

   const good=same(winner,pick);

   if(good)
      correct++;
   else
      wrong++;

   document.querySelectorAll(".bracketMatch").forEach(card=>{

      if(
         card.textContent.includes(a) &&
         card.textContent.includes(b)
      ){

         card.classList.remove(
            "correct",
            "wrong",
            "alive",
            "special"
         );

         card.classList.add(
            good
            ? "correct"
            : "wrong"
         );

         const pill=card.querySelector(".pill");

         if(pill){

            pill.textContent=
            good
            ? `✅ Correct • ${match.scoreText}`
            : `❌ Wrong • ${match.scoreText}`;

         }

      }

   });

 });

 const pct=
 judged
 ?Math.round(correct/judged*100)
 :0;

 setText(
    "live-accuracy",
    judged
    ?`${pct}% • ${correct}/${judged} correct`
    :"No completed picks yet."
 );

 document
 .querySelectorAll("#accuracy .kpi")
 .forEach(el=>{

    el.textContent=
      judged
      ?`${pct}%`
      :el.textContent;

 });

 return{
    judged,
    correct,
    wrong,
    pct
 };
}
/* ==========================================================
   PART 1B
   News • Scoops • Damage
========================================================== */

function buildNews(matches){

  const stories=[];

  const finishedGames=matches.filter(finished);

  finishedGames.forEach(m=>{

    stories.push({
      title:`${m.homeTeam} vs ${m.awayTeam}`,
      body:m.scoreText
    });

  });

  return stories;

}

function renderNews(matches){

  const news=buildNews(matches);

  setHTML(
    "news-feed",
    news.map(n=>card(n.title,n.body)).join("")
  );

}

function renderScoops(matches){

  const finishedGames=matches.filter(finished);

  const liveGames=matches.filter(
    m=>String(m.status).includes("IN_PLAY")
  );

  const scoops=[];

  if(liveGames.length){

    scoops.push(
      `🔴 ${liveGames.length} live match${liveGames.length===1?"":"es"} right now.`
    );

  }

  finishedGames.slice(0,6).forEach(m=>{

    scoops.push(
      `⚽ ${m.scoreText}`
    );

  });

  setHTML(
    "scoop-feed",
    scoops
      .map(s=>card("Live Scoop",s))
      .join("")
  );

}

function renderDamage(matches){

  const damage=[];

  matches
    .filter(finished)
    .forEach(m=>{

      const winner=winnerOf(m);

      if(!winner) return;

      const loser=
        winner===m.homeTeam
        ?m.awayTeam
        :m.homeTeam;

      damage.push(
        `💥 ${loser} was knocked out by ${winner}.`
      );

    });

  setHTML(
    "damage-feed",
    damage
      .map(d=>card("Bracket Damage",d))
      .join("")
  );

}

/* ===== CONTINUES IN PART 1C ===== */
/* ==========================================================
   PART 1C
   Tomorrow • Player Radar • Golden Boot
========================================================== */

function renderTomorrow(matches){

  const upcoming = matches
    .filter(m => String(m.status).includes("SCHEDULED"))
    .sort((a,b)=>new Date(a.utcDate)-new Date(b.utcDate))
    .slice(0,5);

  setHTML(
    "tomorrow-feed",
    upcoming.map(m=>card(
      `${m.homeTeam} vs ${m.awayTeam}`,
      new Date(m.utcDate).toLocaleString()
    )).join("")
  );

}

function renderPlayers(matches){

  const finishedGames = matches.filter(finished);

  const players = [];

  finishedGames.forEach(m=>{

    const winner = winnerOf(m);

    if(!winner) return;

    players.push(
      `⭐ ${winner} moves on after defeating ${
        winner===m.homeTeam
        ?m.awayTeam
        :m.homeTeam
      }.`
    );

  });

  setHTML(
    "player-feed",
    players.map(x=>card("Player Radar",x)).join("")
  );

}

function renderGoldenBoot(matches){

  const finishedGames = matches.filter(finished);

  let goals = 0;

  finishedGames.forEach(m=>{

    goals += (m.homeScore||0);
    goals += (m.awayScore||0);

  });

  setText(
    "golden-boot-total",
    `${goals} tournament goals scored`
  );

}

/* ==========================================================
   PART 1D
=============================================================
/* ==========================================================
   PART 1D
   Main Live Update Loop
========================================================== */

async function loadLiveScores() {

  try {

    setText("live-connection","Connecting...");

    const res = await fetch("/api/live-scores",{
      cache:"no-store"
    });

    const data = await res.json();

    if(!data.ok){
      throw new Error(
        data.error || "Live score error"
      );
    }

    const matches = data.matches || [];

    renderMatches(matches);

    const stats = updateBracket(matches);

    renderNews(matches);

    renderScoops(matches);

    renderDamage(matches);

    renderTomorrow(matches);

    renderPlayers(matches);

    renderGoldenBoot(matches);

    setText(
      "live-connection",
      `Connected • ${matches.length} matches`
    );

    setText(
      "live-updated",
      `Updated ${new Date().toLocaleTimeString()}`
    );

    console.log("Live Engine",stats);

  }

  catch(err){

    console.error(err);

    setText(
      "live-connection",
      "Live update failed"
    );

    setText(
      "live-updated",
      err.message
    );

  }

}

document.addEventListener("DOMContentLoaded",()=>{

  loadLiveScores();

  setInterval(loadLiveScores,180000);

});

/* ==========================================================
   END OF PART 1
========================================================== */
/* ==========================================================
   PART 2A
   SMART BRACKET ENGINE
========================================================== */

function findWinner(matches,a,b){

  const game=matches.find(m=>

      same(m.homeTeam,a)&&same(m.awayTeam,b)
   ||

      same(m.homeTeam,b)&&same(m.awayTeam,a)

  );

  if(!game) return null;

  if(!finished(game)) return null;

  return winnerOf(game);

}

function setCardTeams(card,a,b){

  if(!card) return;

  const teams=card.querySelectorAll(".teamLine");

  if(teams.length>=2){

      teams[0].innerHTML=`<a class="teamInline">${a}</a>`;

      teams[1].innerHTML=`<a class="teamInline">${b}</a>`;

  }

}

function updateFutureBracket(matches){

 const winners={

 canadaSouthAfrica:
 findWinner(matches,"Canada","South Africa"),

 germanyParaguay:
 findWinner(matches,"Germany","Paraguay"),

 franceSweden:
 findWinner(matches,"France","Sweden"),

 netherlandsMorocco:
 findWinner(matches,"Netherlands","Morocco"),

 brazilJapan:
 findWinner(matches,"Brazil","Japan"),

 norwayIvory:
 findWinner(matches,"Norway","Ivory Coast"),

 mexicoEcuador:
 findWinner(matches,"Mexico","Ecuador"),

 englandDR:
 findWinner(matches,"England","DR Congo"),

 belgiumSenegal:
 findWinner(matches,"Belgium","Senegal"),

 usaBosnia:
 findWinner(matches,"United States","Bosnia and Herzegovina"),

 spainAustria:
 findWinner(matches,"Spain","Austria"),

 portugalCroatia:
 findWinner(matches,"Portugal","Croatia"),

 swissAlgeria:
 findWinner(matches,"Switzerland","Algeria"),

 egyptAustralia:
 findWinner(matches,"Egypt","Australia"),

 argentinaCape:
 findWinner(matches,"Argentina","Cape Verde"),

 colombiaGhana:
 findWinner(matches,"Colombia","Ghana")

 };

 const cards=document.querySelectorAll(".bracketMatch");

 if(cards[16])
 setCardTeams(
 cards[16],
 winners.franceSweden||"Winner",
 winners.germanyParaguay||"Winner"
 );

 if(cards[17])
 setCardTeams(
 cards[17],
 winners.canadaSouthAfrica||"Winner",
 winners.netherlandsMorocco||"Winner"
 );

 if(cards[18])
 setCardTeams(
 cards[18],
 winners.spainAustria||"Winner",
 winners.portugalCroatia||"Winner"
 );

 if(cards[19])
 setCardTeams(
 cards[19],
 winners.belgiumSenegal||"Winner",
 winners.usaBosnia||"Winner"
 );

 if(cards[20])
 setCardTeams(
 cards[20],
 winners.brazilJapan||"Winner",
 winners.norwayIvory||"Winner"
 );

 if(cards[21])
 setCardTeams(
 cards[21],
 winners.englandDR||"Winner",
 winners.mexicoEcuador||"Winner"
 );

 if(cards[22])
 setCardTeams(
 cards[22],
 winners.argentinaCape||"Winner",
 winners.egyptAustralia||"Winner"
 );

 if(cards[23])
 setCardTeams(
 cards[23],
 winners.colombiaGhana||"Winner",
 winners.swissAlgeria||"Winner"
 );

}
/* ==========================================================
   PART 2B
   AUTO KNOCKOUT PROGRESSION
========================================================== */

function updateKnockoutTree(matches){

  const r16 = [];

  r16[0] = findWinner(matches,"France","Sweden") ||
           findWinner(matches,"Germany","Paraguay");

  r16[1] = findWinner(matches,"Canada","South Africa") ||
           findWinner(matches,"Netherlands","Morocco");

  r16[2] = findWinner(matches,"Spain","Austria") ||
           findWinner(matches,"Portugal","Croatia");

  r16[3] = findWinner(matches,"Belgium","Senegal") ||
           findWinner(matches,"United States","Bosnia and Herzegovina");

  r16[4] = findWinner(matches,"Brazil","Japan") ||
           findWinner(matches,"Norway","Ivory Coast");

  r16[5] = findWinner(matches,"England","DR Congo") ||
           findWinner(matches,"Mexico","Ecuador");

  r16[6] = findWinner(matches,"Argentina","Cape Verde") ||
           findWinner(matches,"Egypt","Australia");

  r16[7] = findWinner(matches,"Colombia","Ghana") ||
           findWinner(matches,"Switzerland","Algeria");

  const cards = document.querySelectorAll(".bracketMatch");

  /* Quarterfinals */

  if(cards[24]) setCardTeams(cards[24],r16[0]||"Winner",r16[1]||"Winner");

  if(cards[25]) setCardTeams(cards[25],r16[2]||"Winner",r16[3]||"Winner");

  if(cards[26]) setCardTeams(cards[26],r16[4]||"Winner",r16[5]||"Winner");

  if(cards[27]) setCardTeams(cards[27],r16[6]||"Winner",r16[7]||"Winner");

  /* Semifinals */

  if(cards[28]){

    setCardTeams(
      cards[28],
      "Quarterfinal Winner",
      "Quarterfinal Winner"
    );

  }

  if(cards[29]){

    setCardTeams(
      cards[29],
      "Quarterfinal Winner",
      "Quarterfinal Winner"
    );

  }

  /* Final */

  if(cards[30]){

    setCardTeams(
      cards[30],
      "Semifinal Winner",
      "Semifinal Winner"
    );

  }

}

/* ==========================================================
   PART 2C CONTINUES...
========================================================== */
/* ==========================================================
   PART 2C
   LIVE POWER RANKINGS
========================================================== */

function renderPowerRankings(matches){

  const teams = {};

  matches.forEach(m=>{

    if(!teams[m.homeTeam]){
      teams[m.homeTeam]={name:m.homeTeam,pts:0,gf:0,ga:0};
    }

    if(!teams[m.awayTeam]){
      teams[m.awayTeam]={name:m.awayTeam,pts:0,gf:0,ga:0};
    }

    if(typeof m.homeScore==="number"){

      teams[m.homeTeam].gf+=m.homeScore;
      teams[m.homeTeam].ga+=m.awayScore;

      teams[m.awayTeam].gf+=m.awayScore;
      teams[m.awayTeam].ga+=m.homeScore;

      if(m.homeScore>m.awayScore){

        teams[m.homeTeam].pts+=3;

      }else if(m.awayScore>m.homeScore){

        teams[m.awayTeam].pts+=3;

      }else{

        teams[m.homeTeam].pts++;
        teams[m.awayTeam].pts++;

      }

    }

  });

  const ranking=Object.values(teams)
    .sort((a,b)=>b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga))
    .slice(0,10);

  const box=document.getElementById("power-feed");

  if(!box) return;

  box.innerHTML=ranking.map((t,i)=>`

<div class="row">
  <b>#${i+1} ${t.name}</b>
  <span>${t.pts} pts</span>
</div>

`).join("");

}

/* ==========================================================
   PART 2D CONTINUES...
========================================================== */
/* ==========================================================
   PART 2D
   LIVE GROUP STANDINGS
========================================================== */

function renderGroups(matches){

  const groups = {};

  matches.forEach(m=>{

    if(!m.group) return;

    if(!groups[m.group]) groups[m.group] = {};

    [m.homeTeam,m.awayTeam].forEach(team=>{

      if(!groups[m.group][team]){

        groups[m.group][team]={
          team,
          pts:0,
          gf:0,
          ga:0,
          played:0
        };

      }

    });

    if(typeof m.homeScore==="number"){

      const h=groups[m.group][m.homeTeam];
      const a=groups[m.group][m.awayTeam];

      h.played++;
      a.played++;

      h.gf+=m.homeScore;
      h.ga+=m.awayScore;

      a.gf+=m.awayScore;
      a.ga+=m.homeScore;

      if(m.homeScore>m.awayScore){

        h.pts+=3;

      }else if(m.awayScore>m.homeScore){

        a.pts+=3;

      }else{

        h.pts++;
        a.pts++;

      }

    }

  });

  const container=document.getElementById("groups-feed");

  if(!container) return;

  container.innerHTML="";

  Object.keys(groups).sort().forEach(group=>{

    const teams=Object.values(groups[group])
      .sort((a,b)=>
        b.pts-a.pts ||
        (b.gf-b.ga)-(a.gf-a.ga)
      );

    container.innerHTML += `
      <article class="card soccerCard">
        <h3>${group}</h3>
        ${teams.map(t=>`
          <div class="row">
            <b>${t.team}</b>
            <span>${t.pts} pts</span>
          </div>
        `).join("")}
      </article>
    `;

  });

}

function updateLiveDashboard(matches) {
  updateBracket(matches);

  if (typeof updateFutureBracket === "function") {
    updateFutureBracket(matches);
  }

  if (typeof renderGroups === "function") {
    renderGroups(matches);
  }

  if (typeof renderStandings === "function") {
    renderStandings(matches);
  }

  if (typeof renderNews === "function") {
    renderNews(matches);
  }

  if (typeof renderScoops === "function") {
    renderScoops(matches);
  }

  if (typeof renderDamage === "function") {
    renderDamage(matches);
  }

  if (typeof renderPlayers === "function") {
    renderPlayers(matches);
  }
}

async function refreshEverything() {
  try {
    setText("live-connection", "Connecting...");

    const response = await fetch("/api/live-scores", {
      cache: "no-store"
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Live API Error");
    }

    const matches = data.matches || [];

    renderMatches(matches);
    updateLiveDashboard(matches);

    setText(
      "live-connection",
      `Connected • ${matches.length} matches`
    );

    setText(
      "live-updated",
      new Date().toLocaleTimeString()
    );

  } catch (err) {
    console.error(err);

    setText(
      "live-connection",
      "Disconnected"
    );

    setText(
      "live-updated",
      err.message
    );
  }
}

/* ==========================================================
   END PART 2D


document.addEventListener("DOMContentLoaded", () => {
  refreshEverything();

  setInterval(() => {
    refreshEverything();
  }, 180000);
});

// Backwards compatibility
if (typeof loadLiveScores === "undefined") {
  window.loadLiveScores = refreshEverything;
}
