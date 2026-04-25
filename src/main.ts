import { buildApp } from './app.js';
import { PROCESS_EXIT_CODE } from './config/constants.js';

const startServer = async (): Promise<void> => {
  const app = await buildApp();

  await app.listen({ port: app.config.PORT, host: '127.0.0.1' });
};

startServer().catch((err: unknown) => {
  console.error(err);
  process.exit(PROCESS_EXIT_CODE.FAILURE);
});
