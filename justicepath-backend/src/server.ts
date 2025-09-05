import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || '8080';   // Cloud Run will always set this
const HOST = '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  console.log(`✅ Server is running on http://${HOST}:${PORT}`);
});
