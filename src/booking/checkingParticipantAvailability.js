import moment from "moment";
import { logger } from "../logger/logger.js";
import { Booking, BookingAvailability } from "../db/pool.js";
import {Op} from "sequelize";

const FILE_NAME = "checkingParticipantAvailability.js";

export async function checkingParticipantAvailability({ startTime, endTime, requestId, participantId }) {
    try {
        // Parse requested times as UTC
        const requestedStart = moment.utc(startTime);
        const requestedEnd = moment.utc(endTime);

        if (!requestedStart.isValid() || !requestedEnd.isValid()) {
            return {
                error: true,
                errorData: {
                    statusCode: 400,
                    body: { message: "Invalid startTime or endTime format." },
                },
            };
        }

        if (!requestedEnd.isAfter(requestedStart)) {
            return {
                error: true,
                errorData: {
                    statusCode: 400,
                    body: { message: "endTime must be after startTime." },
                },
            };
        }

        // 1. Check if requested time is within an active availability slot (DB-level containment)
        const containingAvailability = await BookingAvailability.findOne({
            where: {
                user_id: participantId,
                active: true,
                start_time: { [Op.lte]: requestedStart.toDate() },
                end_time: { [Op.gte]: requestedEnd.toDate() },
            },
        });

        if (!containingAvailability) {
            return {
                error: true,
                errorData: {
                    statusCode: 409,
                    body: { message: "Participant not available in the requested time range." },
                },
            };
        }

        // 2. Check for overlapping bookings: any booking that starts before requestedEnd and ends after requestedStart
        const overlappingBooking = await Booking.findOne({
            where: {
                participant_id: participantId,
                status: { [Op.ne]: "cancelled" },
                start_time: { [Op.lt]: requestedEnd.toDate() },
                end_time: { [Op.gt]: requestedStart.toDate() },
            },
        });

        if (overlappingBooking) {
            return {
                error: true,
                errorData: {
                    statusCode: 409,
                    body: { message: "Participant already has another booking at this time." },
                },
            };
        }

        return { error: false, data: { available: true } };
    } catch (error) {
        logger.error(FILE_NAME, "checkingParticipantAvailability", requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
        });
        return {
            error: true,
            errorData: {
                statusCode: 500,
                body: { message: "Could not fetch booking" },
            },
        };
    }
}