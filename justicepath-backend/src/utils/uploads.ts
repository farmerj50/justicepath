// src/utils/uploads.ts
import fs from 'fs';
import path from 'path';

// project root, works in dev and after ts build
export const uploadDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created upload dir:', uploadDir);
}
