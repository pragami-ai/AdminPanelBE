// index.js - Lambda entry point
import { app } from './src/server.js';

export const handler = async (event, context) => {
    // Debug: Log the REAL API Gateway event structure
    console.log('=== API GATEWAY EVENT DEBUG ===');
    console.log('Event keys:', Object.keys(event));
    console.log('Full event:', JSON.stringify(event, null, 2));
    console.log('Event type check:');
    console.log('- event.httpMethod:', event.httpMethod);
    console.log('- event.requestContext exists:', !!event.requestContext);
    console.log('- event.path:', event.path);
    console.log('- event.rawPath:', event.rawPath);
    console.log('- event.body:', event.body);
    console.log('- event.pathParameters:', event.pathParameters);
    console.log('- event.headers:', JSON.stringify(event.headers, null, 2));
    console.log("HELLO WORLD")
    try {
        // Transform API Gateway event to your expected format
        const transformedEvent = {
            httpMethod: event.httpMethod || event.requestContext?.http?.method || 'POST',
            path: event.path || event.requestContext?.http?.path || '/admin/login',
            rawPath: event.rawPath || event.path || event.requestContext?.http?.path || '/admin/login',
            headers: event.headers || {},
            body: event.body || '{}',
            isBase64Encoded: event.isBase64Encoded || false,
            // 🔥 FIX: Add pathParameters extraction
            pathParameters: event.pathParameters || event.requestContext?.pathParameters || null,
            // Also add queryStringParameters for completeness
            queryStringParameters: event.queryStringParameters || event.requestContext?.queryStringParameters || null
        };
        
        console.log('Transformed event:', JSON.stringify(transformedEvent, null, 2));
        
        // Call your app with transformed event (app expects 3 parameters)
        const requestId = () => context.awsRequestId;
        const result = await app(transformedEvent, context, requestId);
        
        // Ensure proper API Gateway response format
        return {
            statusCode: result.statusCode || 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body)
        };
        
    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            })
        };
    }
};
