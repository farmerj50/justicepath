// src/server.ts
import app from './app';
import dotenv from 'dotenv';
dotenv.config();

// Use the PORT Cloud Run gives us; fall back to 5000 for dev
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ Server is running on http://${HOST}:${PORT}`);
});
// server.ts (very top, after you create `app`)
app.use((req, _res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });

// quick probe route
app.get('/ping', (_req, res) => res.status(200).send('pong'));
