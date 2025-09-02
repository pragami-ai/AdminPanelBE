import { config } from 'dotenv';
import { getBooking, updateBooking } from '../booking/crud.js';
import { getUser } from '../user/crud.js';
import { logger } from '../logger/logger.js';
import { BOOKING_STATUSES } from '../helper/constants.js';

config();
const FILE_NAME = 'admin/booking/editBooking.js';

export async function adminEditBooking(body) {
    console.log('🔍 adminEditBooking: ENTRY - body:', body);
    
    const { bookingId, creator_id, participant_id, start_time, end_time, requestId } = body;
    delete body.requestId;
    
    try {
        console.log('🔍 adminEditBooking: Processing booking ID:', bookingId);
        
        // Validate required fields
        if (!bookingId) {
            console.log('❌ adminEditBooking: Missing bookingId');
            return {
                statusCode: 400,
                body: {
                    message: 'bookingId is required'
                }
            };
        }

        // Check if booking exists
        console.log('🔍 adminEditBooking: Fetching existing booking...');
        const existingBookingResponse = await getBooking(
            { id: bookingId },
            ['id', 'creator_id', 'participant_id', 'start_time', 'end_time', 'status'],
            requestId
        );

        if (existingBookingResponse.error) {
            console.log('❌ adminEditBooking: Booking not found:', existingBookingResponse);
            return existingBookingResponse.errorData;
        }

        const existingBooking = existingBookingResponse.data.booking;
        console.log('🔍 adminEditBooking: Existing booking:', existingBooking);
        
        const updateData = {};

        // Add time fields if provided
        if (start_time !== undefined) {
            updateData.start_time = new Date(start_time);
            console.log('🔍 adminEditBooking: Adding start_time:', updateData.start_time);
        }
        if (end_time !== undefined) {
            updateData.end_time = new Date(end_time);
            console.log('🔍 adminEditBooking: Adding end_time:', updateData.end_time);
        }

        // Get current values for validation
        const currentStartTime = updateData.start_time || new Date(existingBooking.start_time);
        const currentEndTime = updateData.end_time || new Date(existingBooking.end_time);

        console.log('🔍 adminEditBooking: Current times:', {
            currentStartTime: currentStartTime.toISOString(),
            currentEndTime: currentEndTime.toISOString()
        });

        // AUTO-CALCULATE STATUS BASED ON TIMING
        const now = new Date();
        let autoStatus;
        
        if (currentEndTime <= now) {
            autoStatus = BOOKING_STATUSES.COMPLETED; // 'completed'
        } else if (currentStartTime <= now && currentEndTime > now) {
            autoStatus = BOOKING_STATUSES.ONGOING; // 'ongoing'  
        } else if (currentStartTime > now) {
            autoStatus = BOOKING_STATUSES.SCHEDULED; // 'scheduled'
        }

        console.log('🔍 adminEditBooking: Status calculation:', {
            now: now.toISOString(),
            currentStartTime: currentStartTime.toISOString(),
            currentEndTime: currentEndTime.toISOString(),
            autoStatus,
            BOOKING_STATUSES
        });

        // Add auto-calculated status to update data
        updateData.status = autoStatus;
        console.log('🔍 adminEditBooking: Final updateData:', updateData);

        // Update the booking in database
        console.log('🔍 adminEditBooking: Calling updateBooking...');
        const updateResponse = await updateBooking(
            { id: bookingId },
            updateData,
            requestId
        );

        console.log('🔍 adminEditBooking: Update response:', updateResponse);

        if (updateResponse.error) {
            console.log('❌ adminEditBooking: Update failed:', updateResponse);
            return updateResponse.errorData;
        }

        console.log('✅ adminEditBooking: SUCCESS - booking updated');

        return {
            statusCode: 200,
            body: {
                message: 'Booking updated successfully',
                booking: updateResponse.data.booking,
                autoCalculatedStatus: autoStatus,
                debug: {
                    updateData,
                    originalStatus: existingBooking.status,
                    newStatus: autoStatus
                }
            }
        };

    } catch (error) {
        console.error('❌ adminEditBooking: EXCEPTION:', error);
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to update booking'
            }
        };
    }
}