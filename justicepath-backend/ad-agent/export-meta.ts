import fs from "fs";
import path from "path";
import { createObjectCsvWriter as csvWriter } from "csv-writer";

type ReelScript = {
  hook: string;
  beats: string[];
  cta: string;
  disclaimer?: string;
  caption?: string;
  hashtags?: string[];
};

type StaticConcept = {
  headline: string;
  subline: string;
  primary_text: string;
  cta?: string;
  image_prompt?: string;
};

type CarouselPack = {
  frames?: { overlay: string; body?: string }[];
  primary_text?: string;
  headline_options?: string[];
  url?: string;
  cta?: string;
};

const CONFIG = JSON.parse(fs.readFileSync("ad-agent/agent.config.json", "utf8"));
const CAMPAIGN = CONFIG.instagram?.campaign ?? "JusticePath – Instagram";
const OUT_DIR = path.join("ad-agent", "instagram", "out");
const DEST_URL = `${CONFIG.domain}${CONFIG.defaultLanding}`;
const DISCLAIMER = CONFIG.disclaimer ?? "Not legal advice. Self-help tools.";

// ---------- helpers ----------
function latest(prefix: string) {
  if (!fs.existsSync(OUT_DIR)) return null;
  const files = fs.readdirSync(OUT_DIR).filter(f => f.startsWith(prefix)).sort();
  return files.length ? path.join(OUT_DIR, files[files.length - 1]) : null;
}

function readArray<T = any>(file: string, keys: string[] = ["reels", "items", "data", "list"]): T[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(raw)) return raw as T[];
  for (const k of keys) {
    const v = (raw as any)?.[k];
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}

// ---------- main ----------
(async () => {
  const reelsPath    = latest("ig_reels_");
  const staticPath   = latest("ig_static_");
  const carouselPath = latest("ig_carousel_");

  if (!reelsPath && !staticPath && !carouselPath) {
    console.error("No IG outputs found in ad-agent/instagram/out/");
    process.exit(1);
  }

  const rows: any[] = [];

  // Reels
  if (reelsPath) {
    const reels = readArray<ReelScript>(reelsPath, ["reels", "items", "data"]);
    if (reels.length) {
      reels.forEach((r, i) => {
        const beats = Array.isArray(r.beats) ? r.beats.join(" ") : "";
        rows.push({
          Campaign: CAMPAIGN,
          AdSet: "Reels – GA",
          PrimaryText: [r.hook, beats, r.cta, "", DISCLAIMER].filter(Boolean).join(" "),
          Headline: "Build GA Court Forms",
          Description: "Georgia-specific, self-help tools.",
          URL: DEST_URL,
          CTA: "Sign Up",
          Placement: "Instagram Reels",
        });
      });
    } else {
      console.log("No Reels array found; skipping Reels.");
    }
  }

  // Static
  if (staticPath) {
    const statics = readArray<StaticConcept>(staticPath, ["statics", "concepts", "items", "data"]);
    if (statics.length) {
      statics.forEach((s, i) => {
        rows.push({
          Campaign: CAMPAIGN,
          AdSet: "Feed – Static",
          PrimaryText: [s.primary_text, "", DISCLAIMER].filter(Boolean).join("\n"),
          Headline: s.headline || "Build GA Court Forms",
          Description: s.subline || "",
          URL: DEST_URL,
          CTA: s.cta || "Get Started",
          Placement: "Instagram Feed",
        });
      });
    } else {
      console.log("No Static array found; skipping Static.");
    }
  }

  // Carousel (optional)
  if (carouselPath) {
    const car = JSON.parse(fs.readFileSync(carouselPath, "utf8")) as CarouselPack;
    if (car?.frames?.length) {
      rows.push({
        Campaign: CAMPAIGN,
        AdSet: "Feed – Carousel",
        PrimaryText: [car.primary_text ?? "", "", DISCLAIMER].join("\n"),
        Headline: car.headline_options?.[0] ?? "Build GA Court Forms",
        Description: "Not legal advice.",
        URL: car.url ?? DEST_URL,
        CTA: car.cta ?? "Sign Up",
        Placement: "Instagram Feed",
      });
    } else {
      console.log("No Carousel frames found; skipping Carousel.");
    }
  }

  if (!rows.length) {
    console.error("Nothing to export. Generate IG Reels/Static/Carousel first.");
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `meta_upload_${Date.now()}.csv`);

  const writer = csvWriter({
    path: outPath,
    header: [
      { id: "Campaign",    title: "Campaign" },
      { id: "AdSet",       title: "AdSet" },
      { id: "PrimaryText", title: "PrimaryText" },
      { id: "Headline",    title: "Headline" },
      { id: "Description", title: "Description" },
      { id: "URL",         title: "URL" },
      { id: "CTA",         title: "CTA" },
      { id: "Placement",   title: "Placement" },
    ],
  });

  await writer.writeRecords(rows);
  console.log("Wrote Meta CSV →", outPath);
})();
