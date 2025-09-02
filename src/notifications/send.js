import { Op } from 'sequelize';
import { PushNotificationToken } from '../db/pool.js';
import { logger } from '../logger/logger.js';
import { sendExpoPush } from './expo.js';

const FILE = 'notifications/send.js';

// Reusable service to collect tokens and send via Expo
export async function sendPushToUsers({ userIds = [], title, body, data = {}, requestId }) {
  if (!userIds?.length) return { ok: false, message: 'userIds required', results: [] };

  const tokens = await PushNotificationToken.findAll({
    where: {
      user_id: { [Op.in]: userIds },
      is_active: true,
      // removed device_os filter to broadcast to all active tokens
    },
  });

  const expoTokens = tokens.map((t) => t.token);
  const result = await sendExpoPush({ tokens: expoTokens, title, body, data, requestId });

  if (result.ok && expoTokens.length) {
    const now = new Date();
    await PushNotificationToken.update(
      { last_notified_at: now },
      { where: { token: { [Op.in]: expoTokens } } }
    );
  }

  logger.info(FILE, 'sendPushToUsers', requestId, { count: expoTokens.length, ok: result.ok });
  return { ...result, count: expoTokens.length };
}

// API wrapper: allows targeting by userIds or raw tokens
export async function sendPushAPI(body) {
  const requestId = body?.requestId;
  const { userIds, tokens, title, body: content, data } = body || {};

  if (!(title && content)) {
    return { statusCode: 400, body: { message: 'title and body are required' } };
  }

  // Merge top-level fields into data payload for deep linking on clients
  const finalData = { ...(data || {}) };
  if (body?.message_type) {
    finalData.message_type = body.message_type;
    // Add alias for compatibility with some clients reading `type`
    finalData.type = finalData.type || body.message_type;
  }
  if (typeof body?.id !== 'undefined') {
    finalData.id = body.id;
  }

  try {
    let sendRes;
    if (tokens?.length) {
      sendRes = await sendExpoPush({ tokens, title, body: content, data: finalData, requestId });
    } else if (userIds?.length) {
      sendRes = await sendPushToUsers({ userIds, title, body: content, data: finalData, requestId });
    } else if (body?.userId) {
      sendRes = await sendPushToUsers({ userIds: [body.userId], title, body: content, data: finalData, requestId });
    } else {
      return { statusCode: 400, body: { message: 'Provide tokens or userIds' } };
    }

    return { statusCode: sendRes.ok ? 200 : 500, body: sendRes };
  } catch (err) {
    logger.error(FILE, 'sendPushAPI', requestId, { error: err?.message });
    return { statusCode: 500, body: { message: 'Failed to send push' } };
  }
}