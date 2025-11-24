import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/polybot',
  gammaBaseUrl:
    process.env.GAMMA_BASE_URL || 'https://gamma-api.polymarket.com',
  clobBaseUrl: process.env.CLOB_BASE_URL || 'https://clob.polymarket.com',
};
