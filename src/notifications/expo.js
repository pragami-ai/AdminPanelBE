import axios from 'axios';
import { logger } from '../logger/logger.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export function isValidExpoToken(token) {
  return typeof token === 'string' && token.startsWith('ExponentPushToken[');
}

export async function sendExpoPush({ tokens, title, body, data, sound = 'default', requestId }) {
  const validTokens = (tokens || []).filter(isValidExpoToken);
  if (!validTokens.length) {
    return { ok: false, message: 'No valid Expo tokens provided', results: [] };
  }

  // Expo allows sending an array of messages
  const messages = validTokens.map((to) => ({ to, title, body, data, sound }));

  try {
    const { data: res } = await axios.post(EXPO_PUSH_URL, messages, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    });
    logger.debug('notifications/expo.js', 'sendExpoPush', requestId, { count: messages.length, res });
    return { ok: true, results: res?.data ?? res };
  } catch (err) {
    logger.error('notifications/expo.js', 'sendExpoPush', requestId, { error: err?.message });
    return { ok: false, error: err?.message, results: [] };
  }
}
