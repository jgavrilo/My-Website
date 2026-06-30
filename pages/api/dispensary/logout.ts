import type { NextApiRequest, NextApiResponse } from 'next';
import { clearDispensarySessionCookie } from '../../../lib/dispensary/session';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  clearDispensarySessionCookie(res);
  res.redirect(302, '/dispensary/login');
}
