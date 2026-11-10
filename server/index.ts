import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const port = Number(process.env.PORT) || 8787;
createApp().listen(port, () => {
  console.log(`AuditAI API listening on http://localhost:${port}`);
});
