// backend/src/ADMIN/bookings/getAllBookings.js
import { Op } from "sequelize";
import { config } from 'dotenv';
import { getBookings } from '../booking/crud.js';
import { logger } from '../logger/logger.js';
import { User, UserInformation, Idea } from '../db/pool.js';
import { BOOKING_STATUSES, BOOKING_FILTERS } from '../helper/constants.js';

config();
const FILE_NAME = 'admin/bookings/getAllBookings.js';

export async function adminGetAllBookings(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    // Get filters from body (both optional)
    const timeFilter = body.timeFilter;   // BOOKING_FILTERS: upcoming, active, past, all
    const statusFilter = body.statusFilter; // BOOKING_STATUSES: pending, scheduled, ongoing, completed, cancelled, declined
    const limit = body.limit || 100;     // Pagination
    const offset = body.offset || 0;
    
    delete body.timeFilter;
    delete body.statusFilter; 
    delete body.limit;
    delete body.offset;
    
    try {
        console.log('adminGetAllBookings called with filters:', { timeFilter, statusFilter, limit, offset });
        
        // Build where clause
        let whereClause = {};
        const currentDate = new Date();
        
        // TIME-BASED FILTERING (BOOKING_FILTERS)
        switch (timeFilter) {
            case BOOKING_FILTERS.UPCOMING:
                // Future meetings (any status)
                whereClause.start_time = { [Op.gt]: currentDate };
                break;
                
            case BOOKING_FILTERS.ACTIVE:
                // Currently happening meetings
                whereClause[Op.and] = [
                    { start_time: { [Op.lte]: currentDate } },
                    { end_time: { [Op.gt]: currentDate } }
                ];
                break;
                
            case BOOKING_FILTERS.PAST:
                // Already finished meetings
                whereClause.end_time = { [Op.lt]: currentDate };
                break;
                
            case BOOKING_FILTERS.ALL:
            default:
                // No time filtering
                break;
        }
        
        // STATUS-BASED FILTERING (BOOKING_STATUSES)
        if (statusFilter) {
            // Handle both your constants and database reality
            const validStatuses = [...Object.values(BOOKING_STATUSES), 'ended']; // Include 'ended' from your DB
            if (validStatuses.includes(statusFilter)) {
                whereClause.status = statusFilter;
            }
        }
        
        console.log('Using where clause:', JSON.stringify(whereClause, null, 2));
        
        // Get bookings with filters and joins (ENHANCED with Ideas table)
        const bookingDetailsFromDB = await getBookings(
            whereClause,
            null, // Get all fields
            requestId,
            [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'email', 'persona_type'],
                    include: [{
                        model: UserInformation,
                        as: 'user_information',
                        attributes: ['name', 'avatar', 'profile_title', 'country', 'description']
                    }]
                },
                {
                    model: User,
                    as: 'participant', 
                    attributes: ['id', 'email', 'persona_type'],
                    include: [{
                        model: UserInformation,
                        as: 'user_information',
                        attributes: ['name', 'avatar', 'profile_title', 'country', 'description']
                    }]
                },
                // ENHANCED: Add Ideas join
                {
                    model: Idea,
                    as: 'idea',
                    attributes: ['id', 'name', 'description', 'targeted_audience', 'stage'],
                    required: false // Left join in case some bookings don't have ideas
                }
            ],
            {
                limit,
                offset,
                order: [['created_at', 'DESC']] // Most recent first
            }
        );
        
        if (bookingDetailsFromDB.error) {
            if (bookingDetailsFromDB.errorData?.statusCode === 404) {
                return {
                    statusCode: 200,
                    body: {
                        message: 'No bookings found',
                        bookings: [],
                        totalCount: 0,
                        appliedFilters: { timeFilter: timeFilter || 'all', statusFilter: statusFilter || 'all' },
                        pagination: { limit, offset, hasMore: false }
                    }
                };
            }
            return bookingDetailsFromDB.errorData;
        }

        const bookings = bookingDetailsFromDB.data.bookings;
        
        // Format bookings for admin view (ENHANCED)
        const formattedBookings = bookings.map((data) => {
            const creatorInfo = data.creator?.user_information;
            const participantInfo = data.participant?.user_information;
            
            // Determine time category for each booking
            const startTime = new Date(data.start_time);
            const endTime = new Date(data.end_time);
            let timeCategory = 'unknown';
            
            if (startTime > currentDate) {
                timeCategory = 'upcoming';
            } else if (startTime <= currentDate && endTime > currentDate) {
                timeCategory = 'active';
            } else if (endTime < currentDate) {
                timeCategory = 'past';
            }
            
            // ENHANCED: Meeting status based on fields
            const hasMeetingTakenPlace = !!data.virtual_conference_id;
            const hasTranscriptGenerated = !!data.ai_digest;
            
            return {
                id: data.id,
                status: data.status,
                timeCategory, // Add computed time category
                startTime: data.start_time,
                endTime: data.end_time,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                virtualConferenceId: data.virtual_conference_id,
                
                // ENHANCED: New fields
                ideaId: data.idea_id,
                ideaDetails: data.idea ? {
                    id: data.idea.id,
                    name: data.idea.name,
                    description: data.idea.description,
                    targetedAudience: data.idea.targeted_audience,
                    stage: data.idea.stage
                } : null,
                
                // ENHANCED: Cancellation fields
                isCancelled: data.is_cancel === true || data.is_cancel === 1 || data.cancel_by !== null,
                cancelledBy: data.cancel_by || null,
                cancellationReason: data.cancel_reason || null,
                
                // ENHANCED: AI/Transcript fields
                aiDigest: !!data.ai_digest,
                hasTranscriptGenerated,
                hasMeetingTakenPlace,
                
                // Creator details
                creator: {
                    id: data.creator?.id,
                    email: data.creator?.email,
                    personaType: data.creator?.persona_type,
                    name: creatorInfo?.name || null,
                    avatar: creatorInfo?.avatar || null,
                    profileTitle: creatorInfo?.profile_title || null,
                    country: creatorInfo?.country || null,
                    description: creatorInfo?.description || null
                },
                
                // Participant details  
                participant: {
                    id: data.participant?.id,
                    email: data.participant?.email,
                    personaType: data.participant?.persona_type,
                    name: participantInfo?.name || null,
                    avatar: participantInfo?.avatar || null,
                    profileTitle: participantInfo?.profile_title || null,
                    country: participantInfo?.country || null,
                    description: participantInfo?.description || null
                },
                
                // Meeting metadata
                hasMeetingData: !!data.chime_meeting_response,
                hasTranscript: !!data.transcript_url,
                hasRecording: !!data.video_recording_url,
                transcriptUrl: data.transcript_url || null,
                videoRecordingUrl: data.video_recording_url || null,
                
                // Chime meeting info (if exists)
                meetingId: data.chime_meeting_response?.meetingResponse?.Meeting?.MeetingId || null,
                attendeeCount: data.chime_meeting_response?.attendeeResponses?.length || 0,
                
                // ENHANCED: Meeting summary composite key for DynamoDB lookup
                meetingCompositeKey: data.participant?.id ? `USER${data.participant.id}#MEETING${data.id}` : null
            };
        });
        
        // Generate summary stats (ENHANCED)
        const allStatuses = [...new Set(bookings.map(b => b.status))]; // Get unique statuses from DB
        const statusCounts = {};
        allStatuses.forEach(status => {
            statusCounts[status] = bookings.filter(b => b.status === status).length;
        });
        
        const timeCounts = {
            upcoming: formattedBookings.filter(b => b.timeCategory === 'upcoming').length,
            active: formattedBookings.filter(b => b.timeCategory === 'active').length,
            past: formattedBookings.filter(b => b.timeCategory === 'past').length,
            total: formattedBookings.length
        };
        
        // ENHANCED: Additional stats
        const meetingStats = {
            meetingsTakenPlace: formattedBookings.filter(b => b.hasMeetingTakenPlace).length,
            transcriptsGenerated: formattedBookings.filter(b => b.hasTranscriptGenerated).length,
            cancelledBookings: formattedBookings.filter(b => b.isCancelled).length,
            withIdeas: formattedBookings.filter(b => b.ideaId).length
        };
        
        logger.info(FILE_NAME, 'adminGetAllBookings', requestId, {
            message: 'Admin successfully retrieved bookings',
            totalBookings: bookings.length,
            appliedFilters: { timeFilter: timeFilter || 'all', statusFilter: statusFilter || 'all' },
            statusCounts,
            timeCounts,
            meetingStats // ENHANCED
        });
        
        return {
            statusCode: 200,
            body: {
                message: 'Bookings retrieved successfully',
                bookings: formattedBookings,
                totalCount: bookings.length,
                
                // Applied filters
                appliedFilters: {
                    timeFilter: timeFilter || 'all',
                    statusFilter: statusFilter || 'all'
                },
                
                // Summary statistics
                statusCounts,
                timeCounts,
                meetingStats, // ENHANCED
                
                // Available filter options
                availableFilters: {
                    timeFilters: Object.values(BOOKING_FILTERS),
                    statusFilters: allStatuses // Use actual statuses from DB
                },
                
                // Pagination info
                pagination: {
                    limit,
                    offset,
                    hasMore: bookings.length === limit // Simple check if more results exist
                }
            }
        };
        
    } catch (error) {
        logger.error(FILE_NAME, 'adminGetAllBookings', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            appliedFilters: { timeFilter, statusFilter }
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to fetch bookings.'
            }
        };
    }
}