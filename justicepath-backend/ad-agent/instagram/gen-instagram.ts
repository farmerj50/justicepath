// justicepath-backend/ad-agent/instagram/gen-instagram.ts
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// ---- paths + config
const AGENT_ROOT = path.resolve(__dirname, '..');                  // .../ad-agent
const PROMPTS_DIR = path.join(AGENT_ROOT, 'prompts');
const IG_OUT_DIR = path.join(AGENT_ROOT, 'instagram', 'out');
const CONFIG_PATH = path.join(AGENT_ROOT, 'agent.config.json');

type ReelScript = {
  hook: string; beats: string[]; cta: string; disclaimer: string; caption: string; hashtags: string[];
};
type StaticConcept = {
  headline: string; subline: string; primary_text: string; cta: string; image_prompt: string;
};
type CarouselFrame = { overlay: string; body?: string };
type CarouselPack = { frames: CarouselFrame[]; primary_text: string; headline_options: string[]; url: string; cta: string; };

const CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const apiKey = (process.env.OPENAI_API_KEY || '').trim();
const haveKey = apiKey.length > 0;
const openai = haveKey ? new OpenAI({ apiKey }) : null;

// ---- utils
const ts = () => {
  const d = new Date(); const p = (n:number)=>String(n).padStart(2,'0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};
const ensureDir = (p:string) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
const readOr = (file:string, fallback:string) => {
  try { const s = fs.readFileSync(file, 'utf8').trim(); return s || fallback; } catch { return fallback; }
};

// Minimal fallbacks so the tool still writes output if prompts are empty/missing
const FALLBACK_REELS_PROMPT = `
Create three Instagram Reels UGC scripts (20–30s) for {GEO} users needing eviction/small claims filings.
Each script JSON:
{ "hook":"...", "beats":["...","...","..."], "cta":"Start free at {DOMAIN}{LANDING}",
  "disclaimer":"{DISCLAIMER}", "caption":"Georgia-specific self-help tools. Not legal advice.",
  "hashtags":["#Georgia","#MagistrateCourt","#Eviction","#SmallClaims","#JusticePath"] }`;
const FALLBACK_STATIC_PROMPT = `
Provide two static ad concepts for {GEO}. Each JSON:
{ "headline":"...", "subline":"...", "primary_text":"...", "cta":"Get Started",
  "image_prompt":"Minimal neutral background, Georgia outline subtle, document/checklist icon, space for logo & CTA" }`;

// OpenAI helper (returns JSON)
async function askJSON(prompt: string) {
  if (!haveKey) {
    // Demo fallback output
    return [
      {
        hook: "Filing in GA? Start free.",
        beats: ["Answer questions", "We draft your form", "Print & file"],
        cta: `Start free at ${CONFIG.domain}${CONFIG.defaultLanding}`,
        disclaimer: CONFIG.disclaimer,
        caption: "Georgia-specific self-help tools. Not legal advice.",
        hashtags: ["#Georgia","#MagistrateCourt","#Eviction","#JusticePath"]
      },
      {
        hook: "I had 7 days to respond.",
        beats: ["Found JusticePath", "Plain-English steps", "Filed in time"],
        cta: `Try it at ${CONFIG.domain}${CONFIG.defaultLanding}`,
        disclaimer: CONFIG.disclaimer,
        caption: "Not a law firm.",
        hashtags: ["#Georgia","#SmallClaims","#TenantRights"]
      },
      {
        hook: "Paperwork made simple.",
        beats: ["County-ready templates","Guided builder","One dashboard"],
        cta: `Create your doc at ${CONFIG.domain}${CONFIG.defaultLanding}`,
        disclaimer: CONFIG.disclaimer,
        caption: "Self-help tools.",
        hashtags: ["#Georgia","#MagistrateCourt","#Eviction"]
      }
    ] as ReelScript[];
  }

  const chat = await openai!.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are the JusticePath Advertising Agent. Output valid JSON only." },
      { role: "user", content: prompt }
    ]
  });

  const content = chat.choices[0].message.content ?? "[]";
  return JSON.parse(content);
}

// ---- generators
async function genReels() {
  console.log("Generating REELS pack...");
  const tmpl = readOr(path.join(PROMPTS_DIR, 'reels-ugc.md'), FALLBACK_REELS_PROMPT);
  const prompt = tmpl
    .replaceAll("{GEO}", CONFIG.geo)
    .replaceAll("{DOMAIN}", CONFIG.domain)
    .replaceAll("{LANDING}", CONFIG.defaultLanding)
    .replaceAll("{DISCLAIMER}", CONFIG.disclaimer)
    .replaceAll("{INTENT}", "eviction/small claims filings");
  const out = await askJSON(prompt) as ReelScript[] | any;
  ensureDir(IG_OUT_DIR);
  const file = path.join(IG_OUT_DIR, `ig_reels_${ts()}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("Saved Reels JSON →", file);
}

async function genStatic() {
  console.log("Generating STATIC pack...");
  const tmpl = readOr(path.join(PROMPTS_DIR, 'static-image-prompts.md'), FALLBACK_STATIC_PROMPT);
  const prompt = tmpl.replaceAll("{GEO}", CONFIG.geo);
  const out = await askJSON(prompt) as StaticConcept[] | any;
  ensureDir(IG_OUT_DIR);
  const file = path.join(IG_OUT_DIR, `ig_static_${ts()}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("Saved Static JSON →", file);
}

async function genCarousel() {
  console.log("Generating CAROUSEL pack...");
  const pack: CarouselPack = {
    frames: [
      { overlay: "Filing in Georgia?", body: "Don’t wrestle with forms." },
      { overlay: "Plain-English steps", body: "Answer questions → we draft." },
      { overlay: "County-ready templates", body: "Built for GA Magistrate Court." },
      { overlay: "One workspace", body: "Docs, notes, reminders." },
      { overlay: "Start Free", body: "JusticePath • Not legal advice." }
    ],
    primary_text: "Georgia filings made simpler. Guided steps, county-ready templates, printable documents.",
    headline_options: ["Build GA Court Forms", "Draft in Minutes"],
    url: `${CONFIG.domain}${CONFIG.defaultLanding}`,
    cta: "Sign Up"
  };
  ensureDir(IG_OUT_DIR);
  const file = path.join(IG_OUT_DIR, `ig_carousel_${ts()}.json`);
  fs.writeFileSync(file, JSON.stringify(pack, null, 2));
  console.log("Saved Carousel JSON →", file);
}

// ---- entrypoint
const argv = process.argv.slice(2);
console.log("CWD:", process.cwd());
console.log("Args:", argv);

(async () => {
  let ran = false;
  if (argv.includes("--reels"))    { ran = true; await genReels(); }
  if (argv.includes("--static"))   { ran = true; await genStatic(); }
  if (argv.includes("--carousel")) { ran = true; await genCarousel(); }
  if (!ran) console.log("Usage: --reels | --static | --carousel");
})();
