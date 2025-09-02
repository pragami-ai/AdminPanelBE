// filepath: src/admin/users/verify.js
import { getUser, updateUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';
import { sendPushToUsers } from '../notifications/send.js';
import { MESSAGE_TYPES } from '../helper/constants.js';

const FILE = 'admin/users/verify.js';

export async function verifyAdminUser(body) {
  const requestId = body?.requestId;
  // Accept either `user_id` or `id` in body
  const targetUserId = Number(body?.user_id ?? body?.id);

  if (!targetUserId || Number.isNaN(targetUserId)) {
    return {
      statusCode: 400,
      body: { message: 'user_id is required and must be a number' }
    };
  }

  try {
    const userRes = await getUser({ id: targetUserId }, null, null, requestId);
    if (userRes.error) {
      return userRes.errorData;
    }

    const user = userRes.data.user.get ? userRes.data.user.get({ plain: true }) : userRes.data.user;

    if (user?.verified_by_admin) {
      return {
        statusCode: 200,
        body: { message: 'User already verified' }
      };
    }

    const updRes = await updateUser({ id: targetUserId }, { verified_by_admin: true }, requestId);
    if (updRes.error) {
      return updRes.errorData;
    }

    // Fire-and-forget push notification; do not fail the API if push fails
    try {
      await sendPushToUsers({
        userIds: [targetUserId],
        title: 'Account verified',
        body: 'Your account has been verified by an admin. You can now log in.',
        data: { message_type: MESSAGE_TYPES.ACCOUNT_VERIFIED, id: targetUserId },
        requestId,
      });
      logger.info(FILE, 'verifyAdminUser.push', requestId, { targetUserId });
    } catch (pushErr) {
      logger.error(FILE, 'verifyAdminUser.push', requestId, { error: pushErr?.message });
    }

    return {
      statusCode: 200,
      body: {
        message: 'User verified successfully',
        data: { id: targetUserId }
      }
    };
  } catch (err) {
    logger.error(FILE, 'verifyAdminUser', requestId, { error: err?.message });
    return {
      statusCode: 500,
      body: { message: 'Could not verify user' }
    };
  }
}