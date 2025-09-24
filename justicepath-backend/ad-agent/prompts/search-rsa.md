Generate a Google Ads Responsive Search Ad pack for {INTENT} in {GEO}.
Rules:
- Tone: clear, helpful, direct-response. No legal outcome promises.
- Include county variants: {COUNTIES}.
- Headlines: 8-12, max 30 chars each when possible.
- Descriptions: 2-4, concise, include educational framing and optional disclaimer.
- Final URL: {FINAL_URL}
Return JSON with:
{
  "channel": "google",
  "adgroups": [{
    "name": "{INTENT}",
    "keywords": [... exact/phrase ...],
    "ads": [{
      "headlines": [...],
      "descriptions": [...],
      "path1": "eviction",
      "path2": "georgia",
      "final_url": "{FINAL_URL}"
    }]
  }]
}
