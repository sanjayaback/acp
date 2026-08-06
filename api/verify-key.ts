import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyLicenseKey } from '../src/utils/license';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key } = req.body || {};
    if (!key) {
      return res.status(400).json({ success: false, message: 'Key is required' });
    }

    const result = verifyLicenseKey(key);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Key verification error' });
  }
}
