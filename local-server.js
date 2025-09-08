import express from 'express';
import { config } from 'dotenv';
import { app as lambdaHandler } from './src/server.js';
import { ADMIN_API_PATHS, API_PATHS } from "./src/helper/constants.js";
import cors from 'cors';

config();
const expressApp = express();
expressApp.use(express.json());
expressApp.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Admin Login
expressApp.post(ADMIN_API_PATHS.ADMIN_LOGIN, async (req, res) => {
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.ADMIN_LOGIN,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Admin get all users
expressApp.post(ADMIN_API_PATHS.GET_ALL_USERS, async (req, res) => {
    const result = await lambdaHandler({
        body: JSON.stringify(req.body || {}),
        rawPath: ADMIN_API_PATHS.GET_ALL_USERS,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Admin create user
expressApp.post(ADMIN_API_PATHS.CREATE_USER, async (req, res) => {
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.CREATE_USER,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Approve User - PUT /admin/user/:userId/approve
expressApp.post(ADMIN_API_PATHS.APPROVE_USER, async (req, res) => {
    console.log('🔍 Approve route hit (POST) - targetUserId from body:', req.body.targetUserId);
    console.log('🔍 Request body:', req.body);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body), // Pass body directly - targetUserId is in the body
        rawPath: ADMIN_API_PATHS.APPROVE_USER,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Delete User - POST /admin/user/delete
expressApp.post(ADMIN_API_PATHS.DELETE_USER, async (req, res) => {
    console.log('🔍 Delete User route hit (POST) - targetUserId from body:', req.body.targetUserId);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.DELETE_USER,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Get User Details - POST /admin/user/details
expressApp.post(ADMIN_API_PATHS.GET_USER_DETAILS, async (req, res) => {
    console.log('🔍 Get User Details route hit (POST) - targetUserId from body:', req.body.targetUserId);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.GET_USER_DETAILS,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Edit User - POST /admin/user/edit
expressApp.post(ADMIN_API_PATHS.EDIT_USER, async (req, res) => {
    console.log('🔍 Edit User route hit (POST) - targetUserId from body:', req.body.targetUserId);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.EDIT_USER,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

expressApp.post(ADMIN_API_PATHS.GET_ALL_BOOKINGS, async (req, res) => {
    console.log('🔍 Admin Get All Bookings route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body || {}),
        rawPath: ADMIN_API_PATHS.GET_ALL_BOOKINGS,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

expressApp.post(ADMIN_API_PATHS.CREATE_BOOKING, async (req, res) => {
    console.log('🔍 Admin Create Booking route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.CREATE_BOOKING,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Admin Create Meeting - POST /admin/create-meeting  
expressApp.post(ADMIN_API_PATHS.CREATE_MEETING, async (req, res) => {
    console.log('🔍 Admin Create Meeting route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.CREATE_MEETING,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});



// Admin Update Booking - PUT /admin/update-booking/:id
expressApp.put('/admin/update-booking/:id', async (req, res) => {
    console.log('🔍 Admin Update Booking route hit - bookingId:', req.params.id);
    
    const bodyWithBookingId = {
        ...req.body,
        bookingId: req.params.id,
        adminOverride: true
    };
    
    const result = await lambdaHandler({
        body: JSON.stringify(bodyWithBookingId),
        rawPath: ADMIN_API_PATHS.UPDATE_BOOKING,
        headers: req.headers,
        httpMethod: 'PUT',
        pathParameters: { id: req.params.id }
    });
    res.status(result.statusCode || 200).json(result);
});

// Get Available Slots - POST /get-available-slots
expressApp.post(ADMIN_API_PATHS.AVAILABLE_SLOTS, async (req, res) => {
    console.log('🔍 Get Available Slots route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.AVAILABLE_SLOTS,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// My Idea - POST /my-idea
expressApp.post(ADMIN_API_PATHS.MY_IDEA, async (req, res) => {
    console.log('🔍 My Idea route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.MY_IDEA,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Analytics Routes

// Health Check - GET /admin/health
expressApp.get(ADMIN_API_PATHS.HEALTH, async (req, res) => {
    console.log('🔍 Health Check route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.HEALTH,
        headers: req.headers,
        httpMethod: 'GET'
    });
    res.status(result.statusCode || 200).json(result);
});

// User Overview - GET /admin/analytics/users/overview
expressApp.get(ADMIN_API_PATHS.USERS_OVERVIEW, async (req, res) => {
    console.log('🔍 User Overview route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.USERS_OVERVIEW,
        headers: req.headers,
        httpMethod: 'GET',
        queryStringParameters: req.query
    });
    res.status(result.statusCode || 200).json(result);
});

// User Growth Tracking - GET /admin/analytics/users/growth
expressApp.get(ADMIN_API_PATHS.USERS_GROWTH, async (req, res) => {
    console.log('🔍 User Growth route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.USERS_GROWTH,
        headers: req.headers,
        httpMethod: 'GET',
        queryStringParameters: req.query
    });
    res.status(result.statusCode || 200).json(result);
});

// User Demographics - GET /admin/analytics/users/demographics
expressApp.get(ADMIN_API_PATHS.USERS_DEMOGRAPHICS, async (req, res) => {
    console.log('🔍 User Demographics route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.USERS_DEMOGRAPHICS,
        headers: req.headers,
        httpMethod: 'GET'
    });
    res.status(result.statusCode || 200).json(result);
});

// Ideas Overview - GET /admin/analytics/ideas/overview
expressApp.get(ADMIN_API_PATHS.IDEAS_OVERVIEW, async (req, res) => {
    console.log('🔍 Ideas Overview route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.IDEAS_OVERVIEW,
        headers: req.headers,
        httpMethod: 'GET',
        queryStringParameters: req.query
    });
    res.status(result.statusCode || 200).json(result);
});

// Forms Overview - GET /admin/analytics/forms/overview
expressApp.get(ADMIN_API_PATHS.FORMS_OVERVIEW, async (req, res) => {
    console.log('🔍 Forms Overview route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.FORMS_OVERVIEW,
        headers: req.headers,
        httpMethod: 'GET',
        queryStringParameters: req.query
    });
    res.status(result.statusCode || 200).json(result);
});

// User Engagement Funnel - GET /admin/analytics/engagement/funnel
expressApp.get(ADMIN_API_PATHS.ENGAGEMENT_FUNNEL, async (req, res) => {
    console.log('🔍 Engagement Funnel route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.ENGAGEMENT_FUNNEL,
        headers: req.headers,
        httpMethod: 'GET'
    });
    res.status(result.statusCode || 200).json(result);
});

// SME Management Overview - GET /admin/analytics/sme/overview
expressApp.get(ADMIN_API_PATHS.SME_OVERVIEW, async (req, res) => {
    console.log('🔍 SME Overview route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.SME_OVERVIEW,
        headers: req.headers,
        httpMethod: 'GET',
        queryStringParameters: req.query
    });
    res.status(result.statusCode || 200).json(result);
});

// Booking Session Overview - GET /admin/analytics/bookings/overview
expressApp.get(ADMIN_API_PATHS.BOOKINGS_OVERVIEW, async (req, res) => {
    console.log('🔍 Bookings Overview route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.BOOKINGS_OVERVIEW,
        headers: req.headers,
        httpMethod: 'GET',
        queryStringParameters: req.query
    });
    res.status(result.statusCode || 200).json(result);
});

// Real-time Dashboard - GET /admin/analytics/realtime
expressApp.get(ADMIN_API_PATHS.REALTIME_DASHBOARD, async (req, res) => {
    console.log('🔍 Realtime Dashboard route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.REALTIME_DASHBOARD,
        headers: req.headers,
        httpMethod: 'GET'
    });
    res.status(result.statusCode || 200).json(result);
});

// Video Conferencing Overview - GET /admin/analytics/chime/overview
expressApp.get(ADMIN_API_PATHS.CHIME_OVERVIEW, async (req, res) => {
    console.log('🔍 Chime Overview route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.CHIME_OVERVIEW,
        headers: req.headers,
        httpMethod: 'GET',
        queryStringParameters: req.query
    });
    res.status(result.statusCode || 200).json(result);
});

// Transcript Analytics - GET /admin/analytics/chime/transcripts
expressApp.get(ADMIN_API_PATHS.CHIME_TRANSCRIPTS, async (req, res) => {
    console.log('🔍 Chime Transcripts route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.CHIME_TRANSCRIPTS,
        headers: req.headers,
        httpMethod: 'GET',
        queryStringParameters: req.query
    });
    res.status(result.statusCode || 200).json(result);
});

// Get All Ideas - GET /admin/get-all-ideas-simple
expressApp.get(ADMIN_API_PATHS.GET_ALL_IDEAS_SIMPLE, async (req, res) => {
    console.log('🔍 Get All Ideas route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.query), // Pass query params as body
        rawPath: ADMIN_API_PATHS.GET_ALL_IDEAS_SIMPLE,
        headers: req.headers,
        httpMethod: 'GET'
    });
    res.status(result.statusCode || 200).json(result);
});

// Get Idea Lens Status - POST /admin/idea/lens-status
expressApp.post(ADMIN_API_PATHS.GET_IDEA_LENS_STATUS, async (req, res) => {
    console.log('🔍 Get Idea Lens Status route hit - ideaId:', req.body.ideaId);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.GET_IDEA_LENS_STATUS,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Delete Idea - POST /admin/idea/delete
expressApp.post(ADMIN_API_PATHS.DELETE_IDEA, async (req, res) => {
    console.log('🔍 Delete Idea route hit - ideaId:', req.body.ideaId);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.DELETE_IDEA,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Get All Forms - GET /admin/forms/all
expressApp.get(ADMIN_API_PATHS.GET_ALL_FORMS, async (req, res) => {
    console.log('🔍 Get All Forms route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify({}),
        rawPath: ADMIN_API_PATHS.GET_ALL_FORMS,
        headers: req.headers,
        httpMethod: 'GET'
    });
    res.status(result.statusCode || 200).json(result);
});

// Edit Form - POST /admin/forms/edit
expressApp.post(ADMIN_API_PATHS.EDIT_FORM, async (req, res) => {
    console.log('🔍 Edit Form route hit - formId:', req.body.formId);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.EDIT_FORM,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Get Form Responses - POST /admin/forms/responses
expressApp.post(ADMIN_API_PATHS.GET_FORM_RESPONSES, async (req, res) => {
    console.log('🔍 Get Form Responses route hit - formId:', req.body.formId);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.GET_FORM_RESPONSES,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Delete Form - POST /admin/forms/delete
expressApp.post(ADMIN_API_PATHS.DELETE_FORM, async (req, res) => {
    console.log('🔍 Delete Form route hit - formId:', req.body.formId);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.DELETE_FORM,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

expressApp.post(ADMIN_API_PATHS.GET_USER_SELECTIONS, async (req, res) => {
    console.log('🔍 Get User Selections route hit');
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body || {}),
        rawPath: ADMIN_API_PATHS.GET_USER_SELECTIONS,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

// Edit Booking - POST /admin/bookings/edit
expressApp.post(ADMIN_API_PATHS.EDIT_BOOKING, async (req, res) => {
    console.log('🔍 Edit Booking route hit - bookingId:', req.body.bookingId);
    console.log('🔍 Edit data:', {
        creator_id: req.body.creator_id,
        participant_id: req.body.participant_id,
        start_time: req.body.start_time,
        end_time: req.body.end_time
    });
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.EDIT_BOOKING,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});

expressApp.post(ADMIN_API_PATHS.COST_TRACKING, async (req, res) => {
    console.log('🔍 Cost Tracking route hit');
    console.log('📊 Request body:', req.body);
    
    const result = await lambdaHandler({
        body: JSON.stringify(req.body),
        rawPath: ADMIN_API_PATHS.COST_TRACKING,
        headers: req.headers,
        httpMethod: 'POST'
    });
    res.status(result.statusCode || 200).json(result);
});


const PORT = process.env.PORT || 3001;
expressApp.listen(PORT, () => {
    console.log(`🚀 Local API server running on http://localhost:${PORT}`);
});

