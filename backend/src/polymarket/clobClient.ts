import { ClobClient, ApiKeyCreds } from '@polymarket/clob-client';
import { Wallet } from '@ethersproject/wallet';

const host = process.env.CLOB_HOST || 'https://clob.polymarket.com';
const chainId = Number(process.env.POLY_CHAIN_ID || 137);
const privateKey = process.env.POLY_PRIVATE_KEY as string;
const funder = process.env.POLY_PROXY_ADDRESS as string;
const signatureType = Number(process.env.POLY_SIGNATURE_TYPE || 1);

if (!privateKey) {
  throw new Error('POLY_PRIVATE_KEY is not set in env');
}
if (!funder && (signatureType === 1 || signatureType === 2)) {
  throw new Error('POLY_PROXY_ADDRESS is required when using signatureType 1 or 2');
}

const signer = new Wallet(privateKey);

let clobClientPromise: Promise<ClobClient> | null = null;

export function getClobClient(): Promise<ClobClient> {
  if (!clobClientPromise) {
    clobClientPromise = (async () => {
      console.log('[ClobClient] Initializing...');
      console.log('[ClobClient] Host:', host, 'ChainID:', chainId);
      console.log('[ClobClient] Funder:', funder);
      console.log('[ClobClient] Signer address:', signer.address);
      console.log('[ClobClient] SignatureType:', signatureType);

      // init base client without creds
      const baseClient = new ClobClient(host, chainId, signer);
      console.log('[ClobClient] Deriving API keys via createOrDeriveApiKey');
      const creds: ApiKeyCreds = await baseClient.createOrDeriveApiKey();
      console.log('[ClobClient] API key derived');

      const client = new ClobClient(
        host,
        chainId,
        signer,
        creds,
        signatureType,
        funder
      );
      return client;
    })();
  }
  return clobClientPromise;
}
