// Vercel serverless function: /api/creature
// Uses ANTHROPIC_API_KEY from Vercel Environment Variables.
// Takes a photo (base64), asks Claude's vision model to identify the subject
// and design a one-of-a-kind creature inspired by it.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb"
    }
  }
};

const CREATURE_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string", description: "What the photo actually shows, in a few plain words." },
    name: { type: "string", description: "A fun, inventive creature name inspired by the subject." },
    element: {
      type: "string",
      enum: ["Fire", "Water", "Earth", "Air", "Electric", "Shadow", "Light", "Nature", "Metal", "Ice", "Cosmic"]
    },
    rarity: { type: "string", enum: ["Common", "Uncommon", "Rare", "Epic", "Legendary"] },
    emoji: { type: "string", description: "A single emoji that captures the creature's vibe." },
    colorPrimary: { type: "string", description: "Hex color for the creature's body, e.g. #4de3a0" },
    colorSecondary: { type: "string", description: "A darker or contrasting hex color for shading/accents." },
    ability: { type: "string", description: "A short, punchy special-move name (2-4 words)." },
    stats: {
      type: "object",
      properties: {
        power: { type: "integer" },
        speed: { type: "integer" },
        defense: { type: "integer" },
        magic: { type: "integer" }
      },
      required: ["power", "speed", "defense", "magic"],
      additionalProperties: false
    },
    description: {
      type: "string",
      description: "1-2 playful sentences of flavor text about the creature that reference the real-world object it was summoned from."
    }
  },
  required: ["subject", "name", "element", "rarity", "emoji", "colorPrimary", "colorSecondary", "ability", "stats", "description"],
  additionalProperties: false
};

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Use POST with a photo." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "Missing ANTHROPIC_API_KEY in Vercel Environment Variables." });
  }

  const { image, mediaType } = req.body || {};
  if (!image || typeof image !== "string") {
    return res.status(400).json({ ok: false, error: "No photo data received." });
  }
  if (image.length > 7_000_000) {
    return res.status(413).json({ ok: false, error: "That photo is too large. Try a smaller image." });
  }

  const type = ALLOWED_MEDIA_TYPES.has(mediaType) ? mediaType : "image/jpeg";

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        output_config: { format: { type: "json_schema", schema: CREATURE_SCHEMA } },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: type, data: image } },
              {
                type: "text",
                text: "Look at this photo, identify the main subject, and design a one-of-a-kind creature inspired by it, like a trading-card monster. Base the stats (0-100 each), element, and rarity on the real object's size, energy, texture, and character. Keep the name and ability short and punchy, and have the flavor text playfully reference what the photo actually shows."
              }
            ]
          }
        ]
      })
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (!upstream.ok || !data) {
      return res.status(502).json({ ok: false, error: "Creature generation failed.", details: data || raw });
    }

    if (data.stop_reason === "refusal") {
      return res.status(200).json({ ok: false, error: "The Creature Lab couldn't work with that photo. Try a different one." });
    }

    const textBlock = (data.content || []).find((b) => b.type === "text");
    if (!textBlock) {
      return res.status(502).json({ ok: false, error: "No creature data came back. Try again." });
    }

    let creature;
    try {
      creature = JSON.parse(textBlock.text);
    } catch {
      return res.status(502).json({ ok: false, error: "Couldn't parse the creature data." });
    }

    return res.status(200).json({ ok: true, creature });
  } catch (err) {
    return res.status(502).json({ ok: false, error: "Creature Lab request failed.", details: err.message });
  }
}
