import fs from "fs";
import path from "path";
import 'dotenv/config';
import OpenAI from "openai";                 // ✅ add
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
