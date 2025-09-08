// backend/src/ADMIN/users/getUserDetails.js
import { config } from 'dotenv';
import { getUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';
import { UserInformation, BookingAvailability } from '../db/pool.js';

config();
const FILE_NAME = 'admin/users/getUserDetails.js';

export async function adminGetUserDetails(body) {
    const targetUserId = body.targetUserId; 
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        if (!targetUserId || isNaN(parseInt(targetUserId))) {
            return {
                statusCode: 400,
                body: {
                    message: 'Invalid targetUserId'
                }
            };
        }
        
        const userResponse = await getUser(
            { 
                id: targetUserId,
                deleted_at: null 
            },
            [
                {
                    model: UserInformation,
                    as: 'user_information',
                    required: false,
                    attributes: [
                        'name', 'linkedin', 'github', 'industry', 'country',
                        'experience', 'avatar', 'profile_title', 
                        'cv_url', 'age', 'description', 'gender', 'linkedin_profile_data'
                    ]
                },
                {
                    model: BookingAvailability,
                    as: 'availabilities', // FIXED: Changed from 'booking_availability' to match pool.js
                    required: false,
                    attributes: [
                        'id', 'start_time', 'end_time', 'active', 'created_at', 'updated_at'
                    ]
                }
            ],
            [
                'id', 'email', 'temp_id', 'auth_type', 'persona_type',
                'created_at', 'updated_at', 'verified_by_admin', 'email_verified_at'
            ],
            requestId
        );
        
        if (userResponse.error) {
            return {
                statusCode: 404,
                body: {
                    message: 'User not found'
                }
            };
        }
        
        const user = userResponse.data.user;
        const userInfo = user.user_information;
        const bookingAvailability = user.availabilities; // FIXED: Changed from booking_availability to availabilities

        const availableTimeSlots = bookingAvailability && bookingAvailability.length > 0 
            ? bookingAvailability.filter(slot => slot.active).map(slot => ({
                id: slot.id,
                start_time: slot.start_time,
                end_time: slot.end_time,
                active: slot.active
            }))
            : [];
        
        // Build user details object
        const userDetails = {
            // Core user fields
            id: user.id,
            email: user.email,
            temp_id: user.temp_id,
            auth_type: user.auth_type,
            persona_type: user.persona_type,
            created_at: user.created_at,
            updated_at: user.updated_at,
            verified_by_admin: user.verified_by_admin,
            email_verified_at: user.email_verified_at,
            
            // Profile fields (with null fallbacks)
            name: userInfo?.name || null,
            linkedin: userInfo?.linkedin || null,
            github: userInfo?.github || null,
            industry: userInfo?.industry || null,
            country: userInfo?.country || null,
            experience: userInfo?.experience || null,
            avatar: userInfo?.avatar || null,
            profile_title: userInfo?.profile_title || null,
            cv_url: userInfo?.cv_url || null,
            age: userInfo?.age || null,
            description: userInfo?.description || null,
            gender: userInfo?.gender || null,
            
            // Booking availability (from separate table)
            available_time_slots: availableTimeSlots,
            linkedin_profile_data: null
        };
        
        // Safely parse JSON fields
        const jsonFields = ['linkedin_profile_data'];
        jsonFields.forEach(field => {
            const rawValue = userInfo?.[field];
            if (rawValue) {
                try {
                    if (typeof rawValue === 'string') {
                        userDetails[field] = JSON.parse(rawValue);
                    } else {
                        userDetails[field] = rawValue;
                    }
                } catch (error) {
                    logger.warn(FILE_NAME, 'adminGetUserDetails', requestId, {
                        message: `Failed to parse ${field}`,
                        targetUserId,
                        rawValue,
                        error: error.message
                    });
                    userDetails[field] = rawValue;
                }
            }
        });
        
        logger.info(FILE_NAME, 'adminGetUserDetails', requestId, {
            message: 'User details retrieved successfully',
            targetUserId,
            availableSlotsCount: availableTimeSlots.length
        });
        
        return {
            statusCode: 200,
            body: {
                message: 'User details retrieved successfully',
                user: userDetails
            }
        };
        
    } catch (error) {
        logger.error(FILE_NAME, 'adminGetUserDetails', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            targetUserId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to fetch user details.'
            }
        };
    }
}