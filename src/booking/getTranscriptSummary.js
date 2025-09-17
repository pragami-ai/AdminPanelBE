// backend/src/bookings/getTranscriptSummary.js
import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { getIdea } from "../idea/crud.js";

config();
const FILE_NAME = 'src/bookings/getTranscriptSummary.js';
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const MEETING_SUMMARY = process.env.MEETING_SUMMARY || "meeting_summary";

export async function adminGetTranscriptSummary(body) {
    const requestId = body.requestId;
    const { ideaId, meetingCompositeKey } = body;
    
    try {
        logger.info(FILE_NAME, 'adminGetTranscriptSummary', requestId, {
            ideaId,
            meetingCompositeKey,
            message: 'Fetching transcript summary from DynamoDB'
        });

        // Input validation
        if (!ideaId || !meetingCompositeKey) {
            return {
                statusCode: 400,
                body: {
                    message: 'ideaId and meetingCompositeKey are required'
                }
            };
        }

        // Get idea to find ai_request_id
        const ideaResult = await getIdea(
            { id: ideaId },
            null,
            ['ai_request_id'],
            null,
            requestId
        );

        if (ideaResult.error || !ideaResult.data.idea) {
            return {
                statusCode: 404,
                body: {
                    message: 'Idea not found'
                }
            };
        }

        const aiRequestId = ideaResult.data.idea.ai_request_id;
        if (!aiRequestId) {
            return {
                statusCode: 404,
                body: {
                    message: 'No AI request ID found for this idea'
                }
            };
        }

        // Fetch from DynamoDB
        const dynamoParams = {
            TableName: MEETING_SUMMARY,
            Key: {
                ai_request_id: { S: aiRequestId },
                composite: { S: meetingCompositeKey }
            }
        };

        logger.info(FILE_NAME, 'adminGetTranscriptSummary', requestId, {
            dynamoParams,
            message: 'Querying DynamoDB'
        });

        const result = await dynamoClient.send(new GetItemCommand(dynamoParams));

        if (!result.Item) {
            return {
                statusCode: 404,
                body: {
                    message: 'No transcript summary found for this meeting'
                }
            };
        }

        // Parse the DynamoDB item
        const parsedData = {};
        
        // Extract and parse each field
        Object.keys(result.Item).forEach(key => {
            if (key !== 'ai_request_id' && key !== 'composite') {
                try {
                    if (result.Item[key].S) {
                        // Try to parse as JSON first
                        try {
                            parsedData[key] = JSON.parse(result.Item[key].S);
                        } catch (jsonError) {
                            // If JSON parsing fails, store as string
                            parsedData[key] = result.Item[key].S;
                        }
                    } else if (result.Item[key].N) {
                        // Handle numeric values
                        parsedData[key] = parseFloat(result.Item[key].N);
                    } else if (result.Item[key].BOOL !== undefined) {
                        // Handle boolean values
                        parsedData[key] = result.Item[key].BOOL;
                    }
                } catch (parseError) {
                    logger.warn(FILE_NAME, 'adminGetTranscriptSummary', requestId, {
                        key,
                        parseError: parseError.message,
                        message: 'Failed to parse field from DynamoDB'
                    });
                    // Store raw value if all parsing fails
                    if (result.Item[key].S) {
                        parsedData[key] = result.Item[key].S;
                    }
                }
            }
        });

        // Structure the response to match expected format
        const responseData = {
            ai_request_id: aiRequestId,
            meeting_composite_key: meetingCompositeKey,
            persona_type: parsedData.persona_type || 'unknown',
            
            // Meeting summary (bullet points format)
            summary: parsedData.summary || null,
            
            // Transcript summary (insights and quotes format)
            transcript_summary: parsedData.transcript_summary || null,
            
            // Additional fields
            status: parsedData.status || 'completed',
            generated_at: parsedData.generated_at || new Date().toISOString(),
            timestamp: parsedData.timestamp || Math.floor(Date.now() / 1000),
            
            // Include any other fields that exist in DynamoDB
            ...Object.keys(parsedData).reduce((acc, key) => {
                if (!['summary', 'transcript_summary', 'persona_type', 'status', 'generated_at', 'timestamp'].includes(key)) {
                    acc[key] = parsedData[key];
                }
                return acc;
            }, {})
        };

        logger.info(FILE_NAME, 'adminGetTranscriptSummary', requestId, {
            availableFields: Object.keys(parsedData),
            personaType: responseData.persona_type,
            hasSummary: !!responseData.summary,
            hasTranscriptSummary: !!responseData.transcript_summary,
            message: 'Successfully retrieved transcript summary from DynamoDB'
        });

        return {
            statusCode: 200,
            body: {
                message: 'Transcript summary retrieved successfully',
                data: responseData
            }
        };

    } catch (dynamoError) {
        // Handle DynamoDB specific errors
        if (dynamoError.name === 'ResourceNotFoundException') {
            logger.warn(FILE_NAME, 'adminGetTranscriptSummary', requestId, {
                error: dynamoError.message,
                message: 'DynamoDB table not found'
            });
            return {
                statusCode: 404,
                body: {
                    message: 'Meeting summary table not found'
                }
            };
        }

        logger.error(FILE_NAME, 'adminGetTranscriptSummary', requestId, {
            error: dynamoError,
            errorMessage: dynamoError.message,
            errorStack: dynamoError.stack,
            ideaId,
            meetingCompositeKey,
            message: 'DynamoDB operation failed'
        });

        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to fetch transcript summary.'
            }
        };
    } 
}