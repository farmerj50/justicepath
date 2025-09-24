// justicepath-backend/ad-agent/diagnose.ts
// Lints your generated Google + Instagram packs for compliance + quality.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
const apiKey = (process.env.OPENAI_API_KEY || '').trim();
if (!apiKey) { 
  console.error('OPENAI_API_KEY not set (justicepath-backend/.env)'); 
  process.exit(1); 
}
const openai = new OpenAI({ apiKey });


type PlacementPack = {
  channel: 'google';
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

type ReelScript = {
  hook: string;
  beats: string[];
  cta: string;
  disclaimer: string;
  caption: string;
  hashtags: string[];
};

type StaticConcept = {
  headline: string;
  subline: string;
  primary_text: string;
  cta: string;
  image_prompt: string;
};

type CarouselPack = {
  frames: { overlay: string; body?: string }[];
  primary_text: string;
  headline_options: string[];
  url: string;
  cta: string;
};

// ------------ helpers ------------
const CONFIG = JSON.parse(fs.readFileSync(path.join('ad-agent', 'agent.config.json'), 'utf8'));

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function latest(dir: string, prefix: string) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix)).sort().reverse();
  return files[0] ? path.join(dir, files[0]) : null;
}
const stamp = () => {
  const d = new Date();
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}_${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}`;
};

const RECOMMENDED = {
  google: { minHeadlines: 8, maxHeadlines: 15, maxHeadlineChars: 30, minDescriptions: 2, maxDescriptions: 4, maxDescriptionChars: 90 }
};
const disclaimerOk = (s: string) =>
  /not legal advice/i.test(s) || /self-?help/i.test(s) || /not a law firm/i.test(s);

// ------------ diagnostics ------------
function diagGoogle(report: string[]): void {
  const file = latest(path.join('ad-agent', 'out'), 'google_');
  if (!file) {
    report.push(`- ⚠️ No Google pack JSON found in ad-agent/out/. Run the generator first.`);
    return;
  }

  const pack = JSON.parse(fs.readFileSync(file, 'utf8')) as PlacementPack;
  report.push(`- Google pack: \`${path.basename(file)}\``);

  const countySet = new Set((CONFIG.counties as string[]).map(c => c.toLowerCase()));
  const seenHeadlines = new Set<string>();

  pack.adgroups.forEach(ag => {
    const kwsLower = (ag.keywords || []).map(k => k.toLowerCase());
    const hasCounty = kwsLower.some(k => [...countySet].some(c => k.includes(c)));

    if (!hasCounty) {
      report.push(`  • ⚠️ AdGroup **${ag.name}**: no county variants in keywords. Add ${CONFIG.counties.join(', ')}.`);
    }

    ag.ads.forEach((ad, idx) => {
      // Headlines count
      if (ad.headlines.length < RECOMMENDED.google.minHeadlines) {
        report.push(`  • ⚠️ ${ag.name} (ad ${idx + 1}): only ${ad.headlines.length} headlines (< ${RECOMMENDED.google.minHeadlines}). Add more.`);
      }
      if (ad.headlines.length > RECOMMENDED.google.maxHeadlines) {
        report.push(`  • ℹ️ ${ag.name} (ad ${idx + 1}): ${ad.headlines.length} headlines; Google uses up to ${RECOMMENDED.google.maxHeadlines}.`);
      }
      // Headline length + duplicates
      ad.headlines.forEach(h => {
        if (h.length > RECOMMENDED.google.maxHeadlineChars) {
          report.push(`    ◦ ⚠️ Headline too long (${h.length}): “${h}” (limit ~${RECOMMENDED.google.maxHeadlineChars})`);
        }
        const key = h.trim().toLowerCase();
        if (seenHeadlines.has(key)) {
          report.push(`    ◦ ℹ️ Duplicate headline detected: “${h}”`);
        } else {
          seenHeadlines.add(key);
        }
      });

      // Descriptions
      if (ad.descriptions.length < RECOMMENDED.google.minDescriptions) {
        report.push(`  • ⚠️ ${ag.name} (ad ${idx + 1}): only ${ad.descriptions.length} descriptions (< ${RECOMMENDED.google.minDescriptions}).`);
      }
      if (ad.descriptions.length > RECOMMENDED.google.maxDescriptions) {
        report.push(`  • ℹ️ ${ag.name} (ad ${idx + 1}): ${ad.descriptions.length} descriptions; Google uses up to ${RECOMMENDED.google.maxDescriptions}.`);
      }
      const hasDisc = ad.descriptions.some(disclaimerOk);
      if (!hasDisc) {
        report.push(`  • ⚠️ ${ag.name} (ad ${idx + 1}): add disclaimer line like “Not legal advice. Self-help tools.”`);
      }
      ad.descriptions.forEach(d => {
        if (d.length > RECOMMENDED.google.maxDescriptionChars) {
          report.push(`    ◦ ⚠️ Description too long (${d.length}): “${d.slice(0, 80)}…”`);
        }
      });

      // URL + paths
      if (!ad.final_url.startsWith(CONFIG.domain)) {
        report.push(`  • ⚠️ ${ag.name} (ad ${idx + 1}): final_url (${ad.final_url}) not on ${CONFIG.domain}.`);
      }
      if (!ad.path1 || !ad.path2) {
        report.push(`  • ℹ️ ${ag.name} (ad ${idx + 1}): consider setting Path1/Path2 for relevance (e.g., eviction / georgia).`);
      }
    });
  });
}

function diagInstagram(report: string[]): void {
  const outDir = path.join('ad-agent', 'instagram', 'out');

  const reelsPath = latest(outDir, 'ig_reels_');
  const staticPath = latest(outDir, 'ig_static_');
  const carouselPath = latest(outDir, 'ig_carousel_');

  if (!reelsPath && !staticPath && !carouselPath) {
    report.push(`- ⚠️ No Instagram outputs in ad-agent/instagram/out/. Run gen-instagram first.`);
    return;
  }
  if (reelsPath) {
    const reels = JSON.parse(fs.readFileSync(reelsPath, 'utf8')) as ReelScript[] | any;
    report.push(`- Reels pack: \`${path.basename(reelsPath)}\``);
    (reels as ReelScript[]).forEach((r, i) => {
      if (!r.cta?.includes(CONFIG.domain)) {
        report.push(`  • ⚠️ Reels v${i + 1}: CTA missing domain (${CONFIG.domain}).`);
      }
      const anyDisc = [r.disclaimer, r.caption].some(s => s && disclaimerOk(s));
      if (!anyDisc) report.push(`  • ⚠️ Reels v${i + 1}: add disclaimer (“Not legal advice. Self-help tools.”).`);
      if (!Array.isArray(r.beats) || r.beats.length < 3) {
        report.push(`  • ℹ️ Reels v${i + 1}: add 3 beats (Problem → Solution → Result).`);
      }
    });
  }
  if (staticPath) {
    const statics = JSON.parse(fs.readFileSync(staticPath, 'utf8')) as StaticConcept[];
    report.push(`- Static pack: \`${path.basename(staticPath)}\``);
    statics.forEach((s, i) => {
      if (!disclaimerOk(s.primary_text)) {
        report.push(`  • ⚠️ Static concept ${i + 1}: add disclaimer text to the PrimaryText or caption.`);
      }
    });
  }
  if (carouselPath) {
    const car = JSON.parse(fs.readFileSync(carouselPath, 'utf8')) as CarouselPack;
    report.push(`- Carousel pack: \`${path.basename(carouselPath)}\``);
    if (!car.url.startsWith(CONFIG.domain)) {
      report.push(`  • ⚠️ Carousel URL not on ${CONFIG.domain}.`);
    }
  }
}

// ------------ run ------------
(async () => {
  const lines: string[] = [];
  lines.push(`# JusticePath Ad Agent – Diagnose Report`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  lines.push(`## Google Ads checks`);
  diagGoogle(lines);
  lines.push('');

  lines.push(`## Instagram checks`);
  diagInstagram(lines);
  lines.push('');

  const outDir = path.join('ad-agent', 'out');
  ensureDir(outDir);
  const outPath = path.join(outDir, `diagnose_${stamp()}.md`);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

  console.log(lines.join('\n'));
  console.log(`\nSaved report → ${outPath}`);
})();
