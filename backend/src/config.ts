import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/polybot',
  gammaBaseUrl:
    process.env.GAMMA_BASE_URL || 'https://gamma-api.polymarket.com',
  clobBaseUrl: process.env.CLOB_HOST || process.env.CLOB_BASE_URL || 'https://clob.polymarket.com',
  polyAddress: process.env.POLY_ADDRESS || '',//充值地址
  polyApiKey: process.env.POLY_API_KEY || '',
  polyApiSecret: process.env.POLY_API_SECRET || '',
  polyApiPassphrase: process.env.POLY_API_PASSPHRASE || '',
  polyProxyAddress: process.env.POLY_PROXY_ADDRESS || '',//代理地址
  polyProfileAddress: process.env.POLY_PROFILE_ADDRESS || '',//资金地址
};
