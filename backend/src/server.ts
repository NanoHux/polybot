import { createApp } from './index';

const PORT = Number(process.env.PORT) || 3001;

async function bootstrap() {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal error on bootstrap', err);
  process.exit(1);
});
