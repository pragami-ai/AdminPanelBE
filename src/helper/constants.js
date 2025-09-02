export const ADMIN_API_PATHS = {
    CREATE_MEETING : '/admin/create-meeting',
    CREATE_BOOKING : '/admin/create-booking',
    GET_ALL_BOOKINGS: '/admin/get-all-bookings',
    AVAILABLE_SLOTS: '/admin/get-available-slots',
    UPDATE_BOOKING: '/admin/update-booking',
    GET_USER_SELECTIONS: '/admin/bookings/user-selections',
    EDIT_BOOKING: '/admin/bookings/edit',

    MY_IDEA: '/admin/my-idea',
    GET_ALL_IDEAS_SIMPLE: '/admin/get-all-ideas-simple',
    GET_IDEA_LENS_STATUS: '/admin/idea/lens-status',
    DELETE_IDEA: '/admin/idea/delete',

    ADMIN_LOGIN: '/admin/login',
    ADMIN_LOGOUT: '/admin/logout', 

    CREATE_USER: '/admin/create-user',
    GET_ALL_USERS: '/admin/get-all-users',
    GET_USER_DETAILS: '/admin/user/details',    
    EDIT_USER: '/admin/user/edit',              
    APPROVE_USER: 'admin/verify-user',  
    DELETE_USER: '/admin/user',

    HEALTH: '/admin/health',
    
    // User Analytics
    USERS_OVERVIEW: '/admin/analytics/users/overview',
    USERS_GROWTH: '/admin/analytics/users/growth', 
    USERS_DEMOGRAPHICS: '/admin/analytics/users/demographics',
    IDEAS_OVERVIEW: '/admin/analytics/ideas/overview',  
    FORMS_OVERVIEW: '/admin/analytics/forms/overview',
    ENGAGEMENT_FUNNEL: '/admin/analytics/engagement/funnel',
    REALTIME_DASHBOARD: '/admin/analytics/realtime',
    SME_OVERVIEW: '/admin/analytics/sme/overview',
    BOOKINGS_OVERVIEW: '/admin/analytics/bookings/overview',
    CHIME_OVERVIEW: '/admin/analytics/chime/overview',
    CHIME_TRANSCRIPTS: '/admin/analytics/chime/transcripts',

    GET_ALL_FORMS: '/admin/forms/all',
    EDIT_FORM: '/admin/forms/edit',
    GET_FORM_RESPONSES: '/admin/forms/responses',
    DELETE_FORM: '/admin/forms/delete',


}

export const API_PATHS = {
    LOGIN: '/login',
    SIGNUP: '/signup',
    VERIFY_OTP: '/verify-otp',
    HELLO: '/hello',
    CREATE_ROLE: '/create-role',
    USER_INFORMATION: '/user-information',
    ME: '/me',
    CREATE_IDEA: '/create-idea',
    GET_LATEST_IDEA: '/get-latest-idea',
    STORE_IDEA: '/store-idea',
    GET_STORE_IDEA: '/get-store-idea',
    STORE_BURNING_PROBLEM: '/store-burning-problem',
    IDEA_LENS_SELECTOR: '/idea-lens-selector',
    GET_IDEAS: '/get-ideas',
    CREATE_BOOKING: '/create-booking',
    UPDATE_BOOKING: '/update-booking',
    GET_BOOKING: '/get-booking',
    CREATE_MEETING: '/create-meeting',
    GET_BOOKINGS: '/get-bookings',
    GET_AVAILABLE_SLOTS: '/get-available-slots',
    FORGOT_PASSWORD: '/forgot-password',
    VERIFY_PASSWORD_RESET_OTP: '/verify-password-reset-otp',
    FORGOT_PASSWORD_SET: '/forgot-password-set',
    CHANGE_PASSWORD: '/change-password',
    RESET_PASSWORD: '/reset-password',
    RESEND_OTP: '/resend-otp',
    GOOGLE_OAUTH: '/google-oauth',
    GOOGLE_SIGNUP: '/google-signup',
    GOOGLE_LOGIN: '/google-login',
    ONBOARD_USER: '/onboard-user',
    REGENERATE_IDEA: '/regenerate-idea',
    GET_FORM: '/get-form',
    RETRY_FORM: '/retry-form',
    CREATE_FORM: '/create-form',
    GET_FORM_RESPONSE: '/get-form-response',
    GET_ALL_FORM_RESPONSE: '/get-all-form-response',
    RETRY_FORM_RESPONSE: '/retry-form-response',
    CREATE_FORM_RESPONSE: '/create-form-response',
    SEARCH_USERS: '/search-users',
    GET_IDEA_BY_ID: '/get-idea-by-id',
    IDEA_SURVEY_GENERATOR: '/idea-survey-generator',
    SURVEY_ANALYSIS: '/survey-analysis',
    GET_PUBLIC_FORM: '/get-public-form',
    GET_FORMS: '/get-forms',
    GET_USER_DETAILS: '/get-user-details',
    SME_MATCHMAKING: '/matchmake/sme',
    GET_USER_CONSENT: '/user-consent/verify',
    UPDATE_USER_CONSENT: '/user-consent/provide',
    GOOGLE_AUTH: '/google-auth',
    SELECT_LENSES: '/select-lenses',
    SELECT_SMES: '/select-smes',
    
    
}

export const USER_ROLES = {
    FOUNDER: 'founder',
    SME: 'sme',
    RESPONDENT: 'respondent',
    NOT_SELECTED: 'not_selected'
}

export const AUTH_TYPE = {
    GOOGLE: 'google',
    EMAIL: 'email',
}

export const BOOKING_STATUSES = {
    PENDING: 'pending', // inital status
    SCHEDULED: 'scheduled', // if participant accepts
    ONGOING: 'ongoing', // if meeting startTime has been crossed
    COMPLETED: 'completed', // if meeting has ended
    CANCELLED: 'cancelled', // if creator deletes meeting
    DECLINED: 'declined' // if participant declines request
}

export const BOOKING_FILTERS = {
    UPCOMING: 'upcoming',
    ACTIVE: 'active',
    PAST: 'past',
    ALL: 'all'
}

export const ATTENDEE_STATUSES = {
    JOINED: 'joined',
    DROPPED: 'dropped',
    NOT_JOINED: 'not_joined'
}

export const IDEAS_STATUSES = {
    IN_PROGRESS: 'in progress',
    COMPLETED: 'completed',
}

export const DEFAULT_TIME_SLOTS = [
    {
        day: 1,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    },
    {
        day: 2,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    },
    {
        day: 3,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    },
    {
        day: 4,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    },
    {
        day: 5,
        times: [
            {
                startTime: {
                    hours: 9,
                    minutes: 0
                },
                endTime: {
                    hours: 17,
                    minutes: 0
                }
            }
        ]
    }
]

export const DB_ERRORS = {
    DB_01: {
        code: 'REQ400',
        message: 'Where parameter missing'
    }
}

export const EMAIL_USE_CASES = {
    OTP_VERIFICATION: 'otp_verification',
    FORGOT_PASSWORD: 'forgot_password'
}

export const TABLE_NAMES = {
    ideas: 'ideas',
    users: 'users',
    forms: 'forms',
    bookings: 'bookings',
    form_responses: 'form_responses',
    user_information: 'user_information',
    otp: 'otp',
    lens_selection: 'lens_selection',
    sme_selection: 'sme_selection',
    user_selection: 'user_selection'
}

// !need to complete this
export const VALID_USER_SEARCH_FILTERS = [
    'age',
    'country'
]

export const LENS_TYPES = {
    SME: 'SME',
    SURVEY: 'Survey',
    PEER: 'Peer',
    SOCIAL: 'Social',
}

// ["SME", "Peer", "Social", "Survey"]

export const LENS_STATUSES = {
    COMPLETED: 'completed',
    IN_PROGRESS: 'in progress',
}

export const FORM_STATUSES = {
    UPCOMING: 'upcoming',
    ACTIVE: 'active',
    HAS_RESPONDENT: 'has_respondent',
    PAST: 'past',
    ALL: 'all'
}

export const MESSAGE_TYPES = {
    BOOKING_CREATED: 'BOOKING_CREATED',
    BOOKING_CANCELLED: 'BOOKING_CANCELLED',
    BOOKING_UPDATED: 'BOOKING_UPDATED',
    ACCOUNT_VERIFIED: 'ACCOUNT_VERIFIED'
};
