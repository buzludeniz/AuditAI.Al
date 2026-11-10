import express, { type ErrorRequestHandler } from 'express';
import path from 'node:path';
import { ConfigError, analyzeWithGemini, type Analyzer } from './gemini';
import { LIMITS, ValidationError, validateParsedCsv } from './validate';

export function createApp(analyze: Analyzer = analyzeWithGemini) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze', express.json({ limit: LIMITS.maxBodyBytes }), async (req, res, next) => {
    try {
      const data = validateParsedCsv(req.body);
      res.json(await analyze(data));
    } catch (err) {
      next(err);
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (req, res, next) =>
      req.path.startsWith('/api/') ? next() : res.sendFile(path.join(dist, 'index.html')),
    );
  }

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
    } else if (err?.type === 'entity.too.large') {
      res.status(413).json({ error: 'Request body too large.' });
    } else if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Request body is not valid JSON.' });
    } else if (err instanceof ConfigError) {
      console.error(err.message);
      res.status(503).json({ error: 'Analysis service is not configured.' });
    } else {
      console.error('Analysis failed:', err instanceof Error ? err.message : err);
      res.status(502).json({ error: 'Analysis failed. Please try again.' });
    }
  };
  app.use(onError);

  return app;
}
