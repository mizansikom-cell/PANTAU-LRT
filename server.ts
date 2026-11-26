import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeIncomingEmails, EmailAnalysisError } from './src/lib/analyzeEmails';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'PANTAU-LRT' });
  });

  app.post('/api/analyze-emails', async (req: Request, res: Response) => {
    try {
      const body = req.body as { emailsText?: unknown };
      if (!body || typeof body.emailsText !== 'string') {
        res.status(400).json({
          error:
            'Mohon masukkan minimal satu pesan email masuk atau klik "Muat Contoh Data" sebelum memproses.',
        });
        return;
      }

      const result = await analyzeIncomingEmails(body.emailsText);
      res.json(result);
    } catch (err: unknown) {
      if (err instanceof EmailAnalysisError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error('[PANTAU-LRT] Unexpected server error in /api/analyze-emails:', err);
      res.status(500).json({
        error: 'Terjadi gangguan internal pada server. Silakan klik "Coba lagi".',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PANTAU-LRT] Server berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[PANTAU-LRT] Gagal memulai server:', err);
  process.exit(1);
});
