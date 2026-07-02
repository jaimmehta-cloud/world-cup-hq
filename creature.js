/* ===== Creature Lab ===== */

const CREATURE_STORAGE_KEY = "jaiCreatureCollection";
const RARITY_COLORS = {
  Common: "#bdd0c7",
  Uncommon: "#55e58f",
  Rare: "#69caff",
  Epic: "#c98bff",
  Legendary: "#ffd166"
};

let pendingImage = null; // { base64, mediaType }

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function blobPath(rng, cx, cy, baseR, points, variance) {
  const pts = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = baseR * (1 - variance / 2 + rng() * variance);
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
  for (let i = 0; i < points; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % points];
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    d += `Q ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)} `;
  }
  return d + "Z";
}

function decorationCount(rarity) {
  return { Common: 0, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 6 }[rarity] ?? 0;
}

function creatureSVG(creature) {
  const seed = hashStr((creature.name || "") + "|" + (creature.subject || ""));
  const rng = mulberry32(seed || 1);
  const cx = 100;
  const cy = 108;
  const baseR = 62;
  const primary = creature.colorPrimary || "#55e58f";
  const secondary = creature.colorSecondary || "#0b6b37";
  const body = blobPath(rng, cx, cy, baseR, 10, 0.32);

  const spikes = decorationCount(creature.rarity);
  let spikeMarkup = "";
  for (let i = 0; i < spikes; i++) {
    const angle = -Math.PI / 2 + (i / Math.max(spikes, 1)) * Math.PI * 1.4 - Math.PI * 0.7;
    const r1 = baseR * 0.72;
    const r2 = baseR * (1.15 + rng() * 0.25);
    const x1 = cx + Math.cos(angle) * r1;
    const y1 = cy + Math.sin(angle) * r1;
    const x2 = cx + Math.cos(angle) * r2;
    const y2 = cy + Math.sin(angle) * r2;
    const spread = 0.16;
    const x1b = cx + Math.cos(angle + spread) * r1;
    const y1b = cy + Math.sin(angle + spread) * r1;
    spikeMarkup += `<polygon points="${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x1b.toFixed(1)},${y1b.toFixed(1)}" fill="${secondary}" opacity="0.92"/>`;
  }

  const eyeOffsetX = 15 + rng() * 6;
  const eyeOffsetY = -8 + rng() * 8;
  const eyeR = 11 + rng() * 3;
  const pupilDrift = (rng() - 0.5) * 4;

  const mouthY = cy + 26 + rng() * 6;
  const mouthCurve = rng() > 0.5 ? 10 : -10;

  const gradId = `grad${Math.abs(seed)}`;

  return `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${(creature.name || "Creature").replace(/"/g, "")}">
  <defs>
    <radialGradient id="${gradId}" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </radialGradient>
  </defs>
  ${spikeMarkup}
  <path d="${body}" fill="url(#${gradId})" stroke="${secondary}" stroke-width="2.5"/>
  <circle cx="${cx - eyeOffsetX}" cy="${cy + eyeOffsetY}" r="${eyeR.toFixed(1)}" fill="#0d1b14"/>
  <circle cx="${cx + eyeOffsetX}" cy="${cy + eyeOffsetY}" r="${eyeR.toFixed(1)}" fill="#0d1b14"/>
  <circle cx="${(cx - eyeOffsetX + pupilDrift).toFixed(1)}" cy="${(cy + eyeOffsetY - 2).toFixed(1)}" r="${(eyeR * 0.32).toFixed(1)}" fill="#fff"/>
  <circle cx="${(cx + eyeOffsetX + pupilDrift).toFixed(1)}" cy="${(cy + eyeOffsetY - 2).toFixed(1)}" r="${(eyeR * 0.32).toFixed(1)}" fill="#fff"/>
  <path d="M ${cx - 14} ${mouthY} Q ${cx} ${mouthY + mouthCurve} ${cx + 14} ${mouthY}" stroke="#0d1b14" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`.trim();
}

function el(id) {
  return document.getElementById(id);
}

function setStatus(msg) {
  const s = el("creatureStatus");
  if (s) s.textContent = msg;
}

function fileToDownscaledJPEG(file, maxDim) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo."));
    };
    img.src = url;
  });
}

function statBar(label, value) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return `<div class="statRow"><span>${label}</span><div class="statBarTrack"><div class="statBarFill" style="width:${pct}%;background:linear-gradient(90deg,var(--blue),var(--green))"></div></div><span>${pct}</span></div>`;
}

function renderCreatureCard(creature) {
  const rarityColor = RARITY_COLORS[creature.rarity] || "#bdd0c7";
  const card = el("creatureResultCard");
  const box = el("creatureResult");
  if (!card || !box) return;
  box.innerHTML = `
    <div class="creatureCard">
      <div class="creatureArt">${creatureSVG(creature)}</div>
      <div class="creatureInfo">
        <h3>${creature.emoji || ""} ${creature.name || "Mystery Creature"}</h3>
        <p class="creatureSubject">Summoned from: ${creature.subject || "unknown object"}</p>
        <span class="rarityBadge" style="background:${rarityColor}22;border:1px solid ${rarityColor};color:${rarityColor}">${creature.rarity || "Common"}</span>
        <span class="pill">${creature.element || "Nature"}</span>
        <p class="deepText" style="margin:12px 0">${creature.description || ""}</p>
        <p class="pill">✨ Ability: ${creature.ability || "—"}</p>
        <div style="margin-top:12px">
          ${statBar("Power", creature.stats?.power)}
          ${statBar("Speed", creature.stats?.speed)}
          ${statBar("Defense", creature.stats?.defense)}
          ${statBar("Magic", creature.stats?.magic)}
        </div>
      </div>
    </div>`;
  card.hidden = false;
}

function loadCollection() {
  try {
    return JSON.parse(localStorage.getItem(CREATURE_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToCollection(creature) {
  const list = loadCollection();
  list.unshift({ ...creature, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  localStorage.setItem(CREATURE_STORAGE_KEY, JSON.stringify(list.slice(0, 200)));
  renderCollection();
}

function renderCollection() {
  const list = loadCollection();
  const wrap = el("creatureCollection");
  const count = el("collectionCount");
  if (count) count.textContent = String(list.length);
  if (!wrap) return;
  if (!list.length) {
    wrap.innerHTML = `<p class="creatureEmpty">No creatures summoned yet. Snap a photo above to start your collection.</p>`;
    return;
  }
  wrap.innerHTML = list
    .map(
      (c, i) => `<div class="creatureChip" data-index="${i}">${creatureSVG(c)}<div class="cName">${c.emoji || ""} ${c.name || "Creature"}</div><div class="cMeta">${c.rarity || ""}</div></div>`
    )
    .join("");
  wrap.querySelectorAll(".creatureChip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const idx = Number(chip.getAttribute("data-index"));
      const creature = loadCollection()[idx];
      if (creature) {
        renderCreatureCard(creature);
        el("creatureResultCard")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });
}

async function summonCreature() {
  if (!pendingImage) return;
  const btn = el("summonBtn");
  if (btn) btn.disabled = true;
  setStatus("🔮 Analyzing your photo and summoning a creature…");
  try {
    const res = await fetch("/api/creature", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(pendingImage)
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Creature generation failed.");
    }
    renderCreatureCard(data.creature);
    saveToCollection(data.creature);
    setStatus("✅ Creature summoned! Snap another photo to summon a new one.");
  } catch (err) {
    setStatus("⚠️ " + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function initCreatureLab() {
  const input = el("creaturePhoto");
  const btn = el("summonBtn");
  if (!input || !btn) return;

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    setStatus("Preparing your photo…");
    try {
      const dataUrl = await fileToDownscaledJPEG(file, 900);
      const [, base64] = dataUrl.split(",");
      pendingImage = { image: base64, mediaType: "image/jpeg" };
      el("creaturePreview").src = dataUrl;
      el("creaturePreviewWrap").hidden = false;
      btn.disabled = false;
      setStatus("Ready. Tap Summon Creature.");
    } catch (err) {
      setStatus("⚠️ " + err.message);
    }
  });

  btn.addEventListener("click", summonCreature);
  renderCollection();
}

document.addEventListener("DOMContentLoaded", initCreatureLab);
