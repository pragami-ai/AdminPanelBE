import {Op} from 'sequelize';
import {createBooking} from "../booking/crud.js";
import {getUsers} from "../user/crud.js";
import {getIdea} from "../idea/crud.js";
import {logger} from "../logger/logger.js";
import {sendMailWithAPI} from "../helper/AWS/ses.js";
import {sendPushToUsers} from "../notifications/send.js";
import {checkingParticipantAvailability} from "../booking/checkingParticipantAvailability.js";
import {DynamoDBClient, PutItemCommand, GetItemCommand} from "@aws-sdk/client-dynamodb";
import {meetingSummaryAxiosInstance} from "../helper/axiosInstance.js";
import {USER_ROLES} from "../helper/constants.js";

const dynamoClient = new DynamoDBClient({region: process.env.AWS_REGION});

const FILE_NAME = "admin/create.js";

function formatDateTime(isoString) {
    return new Date(isoString).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });
}

export async function createBookingAdmin(body) {
    const requestId = body.requestId;
    delete body.requestId;

    try {
        // Handle both email and ID inputs for flexibility
        const {creatorId, participantId, creatorEmail, participantEmail, startTime, endTime} = body;

        let usersResult;
        
        // Check if we have emails or IDs
        if (creatorEmail && participantEmail) {
            const emails = [creatorEmail, participantEmail];
            usersResult = await getUsers({email: {[Op.in]: emails}}, null, null, requestId);
        } else if (creatorId && participantId) {
            const userIds = [creatorId, participantId];
            usersResult = await getUsers({id: {[Op.in]: userIds}}, null, null, requestId);
        } else {
            return {
                statusCode: 400,
                body: {
                    message: "Either provide both emails (creatorEmail, participantEmail) or both IDs (creatorId, participantId)"
                }
            };
        }

        if (usersResult.error) {
            return usersResult.errorData;
        }

        if (!usersResult.data?.users || usersResult.data.users.length !== 2) {
            return {
                statusCode: 400,
                body: {
                    message: `Expected 2 users, found ${usersResult.data?.users?.length || 0}. Check if both users exist.`
                }
            };
        }

        const users = JSON.parse(JSON.stringify(usersResult));
        
        // Find users by email or ID
        let creatorUser, participantUser;
        
        if (creatorEmail && participantEmail) {
            creatorUser = users.data.users.find(u => u.email === creatorEmail);
            participantUser = users.data.users.find(u => u.email === participantEmail);
        } else {
            creatorUser = users.data.users.find(u => u.id === creatorId);
            participantUser = users.data.users.find(u => u.id === participantId);
        }

        if (!creatorUser || !participantUser) {
            return {
                statusCode: 400,
                body: {
                    message: `Could not find both users. Found: ${users.data.users.map(u => `${u.email}:${u.persona_type}`).join(', ')}`
                }
            };
        }

        // ADDED: Check participant availability before proceeding
        const participantAvailability = await checkingParticipantAvailability({ 
            startTime, 
            endTime, 
            requestId, 
            participantId: participantUser.id 
        });

        if (participantAvailability.error) {
            return {
                statusCode: participantAvailability?.errorData?.statusCode || 409,
                body: { 
                    message: participantAvailability.errorData.body.message || 'Participant not available for the requested time slot' 
                }
            };
        }

        // Find a founder among the users to get their idea (needed for meeting prep)
        const founderUser = users.data.users.find(u => u.persona_type === USER_ROLES.FOUNDER);
        
        let founderIdea = null;
        if (founderUser) {
            const founderIdeaResult = await getIdea(
                {
                    user_id: founderUser.id,
                    idea_capture: {[Op.ne]: null}
                },
                null,
                null,
                [['created_at', 'DESC']],
                requestId
            );

            if (!founderIdeaResult.error && founderIdeaResult.data.idea) {
                founderIdea = founderIdeaResult.data.idea;
            }
        }

        // Create new booking using the actual user IDs from database
        const bookingData = {
            creator_id: creatorUser.id,
            participant_id: participantUser.id,
            start_time: startTime,
            end_time: endTime,
            status: "scheduled",
        };

        // Add idea_id if we found a founder's idea
        if (founderIdea) {
            bookingData.idea_id = founderIdea.id;
        }

        const bookingResponse = await createBooking(bookingData, requestId);
        if (bookingResponse.error) {
            throw new Error("Failed to create booking with meeting details");
        }

        try {
            // Only proceed with meeting prep if we have a founder and their idea
            if (founderUser && founderIdea) {
                // Create composite key for DynamoDB
                const meetingCompositeKey = `USER${founderUser.id}#MEETING${founderIdea.ai_request_id}`;
                const existingData = await dynamoClient.send(new GetItemCommand({
                    TableName: "meeting_summary",
                    Key: {
                        ai_request_id: {S: founderIdea.ai_request_id},
                        composite: {S: meetingCompositeKey}
                    }
                }));
                let meetingPrepData;

                if (existingData.Item) {
                    meetingPrepData = JSON.parse(existingData.Item.summary.S);
                } else {
                    const aiPayload = {
                        request_id: founderIdea.ai_request_id,
                        user_id: founderUser.id.toString(),
                        persona_type: "SME",
                        meeting_id: `meeting-${bookingResponse.data.bookingResponse.id}`
                    };
                    const meetingPrepResponse = await meetingSummaryAxiosInstance.post("/meeting-prep", aiPayload);
                    meetingPrepData = meetingPrepResponse.data;

                    if (meetingPrepData) {
                        await dynamoClient.send(new PutItemCommand({
                            TableName: "meeting_summary",
                            Item: {
                                ai_request_id: {S: founderIdea.ai_request_id},
                                composite: {S: meetingCompositeKey},
                                summary: {S: JSON.stringify(meetingPrepData)}
                            }
                        }));
                    }
                }

                // Extract bullet points from meeting prep data
                const {founder_bullet_points, sme_bullet_points} = meetingPrepData;

                // Send emails with meeting prep if we have the data
                if (founder_bullet_points && sme_bullet_points) {
                    // Send email to creator
                    try {
                        const creatorContent = creatorUser.persona_type === USER_ROLES.FOUNDER ? founder_bullet_points : sme_bullet_points;
                        await sendMailWithAPI({
                            to: creatorUser.email,
                            subject: `Meeting Preparation Guide - ${creatorUser.persona_type.toUpperCase()}`,
                            html: `
                                <p>Your meeting is scheduled for <strong>${formatDateTime(startTime)}</strong></p>
                                ${creatorContent.replace(/\n/g, "<br>")}
                            `,
                            text: `Meeting Preparation Guide\n\nYour meeting is scheduled for ${formatDateTime(startTime)}\n\n${creatorContent}`,
                            requestId,
                        });
                        
                        // Send push notification to creator
                        await sendPushToUsers({
                            userIds: [creatorUser.id],
                            title: "Meeting Scheduled",
                            body: `Your meeting with ${participantUser.email} is scheduled for ${formatDateTime(startTime)}`,
                            data: {
                                type: "meeting_scheduled",
                                bookingId: bookingResponse.data.bookingResponse.id,
                                participantEmail: participantUser.email,
                                startTime: startTime,
                                endTime: endTime
                            },
                            requestId
                        });
                        
                        logger.info(FILE_NAME, "createBookingAdmin", requestId, {
                            message: "Creator email and push notification sent successfully",
                            email: creatorUser.email,
                        });
                    } catch (emailError) {
                        logger.error(FILE_NAME, "createBookingAdmin", requestId, {
                            error: emailError,
                            message: "Failed to send creator email/notification",
                        });
                    }

                    // Send email to participant
                    try {
                        const participantContent = participantUser.persona_type === USER_ROLES.FOUNDER ? founder_bullet_points : sme_bullet_points;
                        await sendMailWithAPI({
                            to: participantUser.email,
                            subject: `Meeting Preparation Guide - ${participantUser.persona_type.toUpperCase()}`,
                            html: `
                                <p>Your meeting is scheduled for <strong>${formatDateTime(startTime)}</strong></p>
                                ${participantContent.replace(/\n/g, "<br>")}
                            `,
                            text: `Meeting Preparation Guide\n\nYour meeting is scheduled for ${formatDateTime(startTime)}\n\n${participantContent}`,
                            requestId,
                        });
                        
                        // Send push notification to participant
                        await sendPushToUsers({
                            userIds: [participantUser.id],
                            title: "Meeting Scheduled",
                            body: `Your meeting with ${creatorUser.email} is scheduled for ${formatDateTime(startTime)}`,
                            data: {
                                type: "meeting_scheduled", 
                                bookingId: bookingResponse.data.bookingResponse.id,
                                creatorEmail: creatorUser.email,
                                startTime: startTime,
                                endTime: endTime
                            },
                            requestId
                        });
                        
                        logger.info(FILE_NAME, "createBookingAdmin", requestId, {
                            message: "Participant email and push notification sent successfully",
                            email: participantUser.email,
                        });
                    } catch (emailError) {
                        logger.error(FILE_NAME, "createBookingAdmin", requestId, {
                            error: emailError,
                            message: "Failed to send participant email/notification",
                        });
                    }
                }
            } else {
                // No founder found, just send basic meeting confirmation emails
                const basicEmailContent = `
                    <p>Your meeting is scheduled for <strong>${formatDateTime(startTime)}</strong></p>
                    <p>Meeting details:</p>
                    <ul>
                        <li>Creator: ${creatorUser.email}</li>
                        <li>Participant: ${participantUser.email}</li>
                        <li>Start: ${formatDateTime(startTime)}</li>
                        <li>End: ${formatDateTime(endTime)}</li>
                    </ul>
                `;

                // Send to both users
                for (const user of [creatorUser, participantUser]) {
                    try {
                        await sendMailWithAPI({
                            to: user.email,
                            subject: "Meeting Scheduled",
                            html: basicEmailContent,
                            text: `Meeting scheduled for ${formatDateTime(startTime)}`,
                            requestId,
                        });

                        const otherUser = user === creatorUser ? participantUser : creatorUser;
                        await sendPushToUsers({
                            userIds: [user.id],
                            title: "Meeting Scheduled",
                            body: `Your meeting with ${otherUser.email} is scheduled for ${formatDateTime(startTime)}`,
                            data: {
                                type: "meeting_scheduled",
                                bookingId: bookingResponse.data.bookingResponse.id,
                                otherUserEmail: otherUser.email,
                                startTime: startTime,
                                endTime: endTime
                            },
                            requestId
                        });

                        logger.info(FILE_NAME, "createBookingAdmin", requestId, {
                            message: "Basic meeting email and push notification sent successfully",
                            email: user.email,
                        });
                    } catch (emailError) {
                        logger.error(FILE_NAME, "createBookingAdmin", requestId, {
                            error: emailError,
                            message: `Failed to send email/notification to ${user.email}`,
                        });
                    }
                }
            }
        } catch (error) {
            logger.error(FILE_NAME, "createBookingAdmin", requestId, {
                error: error.response?.data || error.message,
                status: error.response?.status,
                message: "Meeting prep API call failed",
            });
        }

        return {
            statusCode: 200,
            body: {
                message: "Booking created successfully",
                booking: bookingResponse.data.bookingResponse,
                bookingId: bookingResponse.data.bookingResponse.id
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, "createBookingAdmin", requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
        });
        return {
            statusCode: 500,
            body: {
                message: "Could not create meeting",
            },
        };
    }
}