import fs from "fs";
import path from "path";
import { createObjectCsvWriter as csvWriter } from "csv-writer";
import OpenAI from 'openai';
const apiKey = (process.env.OPENAI_API_KEY || '').trim();
if (!apiKey) { 
  console.error('OPENAI_API_KEY not set (justicepath-backend/.env)'); 
  process.exit(1); 
}
const openai = new OpenAI({ apiKey });


type PlacementPack = {
  channel: "google";
  adgroups: Array<{
    name: string;
    keywords: string[];
    ads: Array<{
      headlines: string[];
      descriptions: string[];
      path1?: string;
      path2?: string;
      final_url: string;
    }>;
  }>;
};

function latestGoogleJson(): string | null {
  const dir = "ad-agent/out";
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.startsWith("google_") && f.endsWith(".json"));
  if (!files.length) return null;
  files.sort();
  return path.join(dir, files[files.length - 1]);
}

(async () => {
  const file = latestGoogleJson();
  if (!file) { console.error("No google_* JSON in ad-agent/out"); process.exit(1); }

  const pack = JSON.parse(fs.readFileSync(file, "utf8")) as PlacementPack;

  const rows: any[] = [];
  const campaign = "JusticePath GA – Search";
  pack.adgroups.forEach(ag => {
    ag.ads.forEach(ad => {
      const h = ad.headlines.slice(0, 15);
      while (h.length < 15) h.push(""); // pad
      const d = ad.descriptions.slice(0, 4);
      while (d.length < 4) d.push("");
      rows.push({
        Campaign: campaign,
        AdGroup: ag.name,
        FinalURL: ad.final_url,
        Path1: ad.path1 || "",
        Path2: ad.path2 || "",
        Headline1: h[0], Headline2: h[1], Headline3: h[2], Headline4: h[3], Headline5: h[4],
        Headline6: h[5], Headline7: h[6], Headline8: h[7], Headline9: h[8], Headline10: h[9],
        Headline11: h[10], Headline12: h[11], Headline13: h[12], Headline14: h[13], Headline15: h[14],
        Description1: d[0], Description2: d[1], Description3: d[2], Description4: d[3]
      });
    });
  });

  const outDir = "ad-agent/out";
  const outPath = path.join(outDir, `google_rsa_${Date.now()}.csv`);
  const writer = csvWriter({
    path: outPath,
    header: [
      { id: "Campaign", title: "Campaign" },
      { id: "AdGroup", title: "AdGroup" },
      { id: "FinalURL", title: "FinalURL" },
      { id: "Path1", title: "Path1" },
      { id: "Path2", title: "Path2" },
      { id: "Headline1", title: "Headline1" },
      { id: "Headline2", title: "Headline2" },
      { id: "Headline3", title: "Headline3" },
      { id: "Headline4", title: "Headline4" },
      { id: "Headline5", title: "Headline5" },
      { id: "Headline6", title: "Headline6" },
      { id: "Headline7", title: "Headline7" },
      { id: "Headline8", title: "Headline8" },
      { id: "Headline9", title: "Headline9" },
      { id: "Headline10", title: "Headline10" },
      { id: "Headline11", title: "Headline11" },
      { id: "Headline12", title: "Headline12" },
      { id: "Headline13", title: "Headline13" },
      { id: "Headline14", title: "Headline14" },
      { id: "Headline15", title: "Headline15" },
      { id: "Description1", title: "Description1" },
      { id: "Description2", title: "Description2" },
      { id: "Description3", title: "Description3" },
      { id: "Description4", title: "Description4" }
    ]
  });

  await writer.writeRecords(rows);
  console.log(`Wrote Google RSA CSV → ${outPath}`);
})();
