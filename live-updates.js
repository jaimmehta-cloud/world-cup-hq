document.querySelectorAll('button[data-screen]').forEach(b=>{
 b.onclick=()=>{
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(b.dataset.screen).classList.add('active');
 };
});

async function loadLiveScores(){
 try{
  const r=await fetch('/api/live-scores');
  const d=await r.json();
  document.getElementById('live-connection').textContent=d.ok?'Connected':'Error';
  document.getElementById('live-matches').innerHTML=(d.matches||[])
   .map(m=>`<div>${m.homeTeam} ${m.homeScore??'-'} - ${m.awayScore??'-'} ${m.awayTeam}</div>`).join('');
 }catch(e){
  document.getElementById('live-connection').textContent=e.message;
 }
}
loadLiveScores();
setInterval(loadLiveScores,180000);
