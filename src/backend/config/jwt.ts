import 'dotenv/config';

export const JWT_SECRET = (process.env.JWT_SECRET || 'orion_fallback_secret_321').trim();
