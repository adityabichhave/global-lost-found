import { onRequest } from "firebase-functions/v2/https";
import fetch from "node-fetch";
import { getConfig } from "firebase-functions";

const GEMINI_KEY = getConfig().gemini.key;

export const generateItemImage = onRequest(async (req, res) => {
  try {
    const { itemName } = req.body;

    if (!itemName) {
      return res.status(400).json({ error: "Item name required" });
    }

    const prompt = `
      Ultra realistic product photograph of a ${itemName}.
      Centered object, clean studio background,
      professional lighting, no text, no watermark,
      e-commerce quality, high detail.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    const imageBase64 =
      data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!imageBase64) {
      return res.json({ image: "" });
    }

    res.json({
      image: `data:image/png;base64,${imageBase64}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image generation failed" });
  }
});
