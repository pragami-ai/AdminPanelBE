import fs from 'node:fs';
import Redis from "ioredis";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

import { config } from 'dotenv';
import { Sequelize } from 'sequelize';
import { logger } from '../logger/logger.js';
import { ideaSchema } from './models/idea.js';
import { formSchema } from './models/forms.js';
import { TABLE_NAMES } from '../helper/constants.js';
import { bookingsSchema } from './models/bookings.js';
import { formResponseSchema } from './models/form_responses.js';
import { userInformationSchema, userSchema } from './models/users.js';
import {otpSchema} from "./models/otp.js";
import { lensSelectionSchema } from './models/lens_selection.js';
import { smeSelectionSchema } from './models/sme_selection.js';
import { userSelectionSchema } from './models/user_selection.js';
import { pushNotificationTokenSchema } from './models/push_notification_tokens.js';
import { bookingAvailabilitySchema } from './models/booking_availability.js';
config();

// Environment-based SSL configuration
// Environment-based SSL configuration
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    dialectOptions: {
        ssl: {
            require: false,
            rejectUnauthorized: false,
            ca: fs.readFileSync(path.join(__dirname, 'cert', `${process.env.AWS_REGION}.bundle.pem`), 'utf8'),
        },
        statement_timeout: 10_000,
    },
    pool: {
        max: 2,
        min: 0,
        idle: 0,
        acquire: 3000,
        evict: 3000
    }
});

// Rest of your code remains the same...

export const User = sequelize.isDefined('User')
    ? sequelize.models.User
    : sequelize.define(
        'User', 
        userSchema, 
        { 
            tableName: TABLE_NAMES.users,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const UserInformation = sequelize.isDefined('UserInformation')
    ? sequelize.models.UserInformation
    : sequelize.define(
        'UserInformation', 
        userInformationSchema, 
        { 
            tableName: TABLE_NAMES.user_information,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const Idea = sequelize.isDefined('Idea')
    ? sequelize.models.Idea
    : sequelize.define(
        'Idea', 
        ideaSchema, 
        { 
            tableName: TABLE_NAMES.ideas,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const Booking = sequelize.isDefined('Booking')
    ? sequelize.models.Booking
    : sequelize.define(
        'Booking', 
        bookingsSchema, 
        { 
            tableName: TABLE_NAMES.bookings,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const Form = sequelize.isDefined('Form')
    ? sequelize.models.Form
    : sequelize.define(
        'Form', 
        formSchema, 
        { 
            tableName: TABLE_NAMES.forms,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const FormResponses = sequelize.isDefined('FormResponses')
    ? sequelize.models.FormResponses
    : sequelize.define(
        'FormResponses', 
        formResponseSchema, 
        { 
            tableName: TABLE_NAMES.form_responses,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    )

export const Otp = sequelize.isDefined('Otp')
    ? sequelize.models.Otp
    : sequelize.define(
        'Otp',
        otpSchema,
        {
            tableName: TABLE_NAMES.otp,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

export const LensSelection = sequelize.isDefined('LensSelection')
    ? sequelize.models.LensSelection
    : sequelize.define(
        'LensSelection',
        lensSelectionSchema,
        {
            tableName: TABLE_NAMES.lens_selection,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

export const SmeSelection = sequelize.isDefined('SmeSelection')
    ? sequelize.models.SmeSelection
    : sequelize.define(
        'SmeSelection',
        smeSelectionSchema,
        {
            tableName: TABLE_NAMES.sme_selection,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

export const UserSelection = sequelize.isDefined('UserSelection')
    ? sequelize.models.UserSelection
    : sequelize.define(
        'UserSelection',
        userSelectionSchema,
        {
            tableName: TABLE_NAMES.user_selection,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

export const PushNotificationToken = sequelize.isDefined('PushNotificationToken')
    ? sequelize.models.PushNotificationToken
    : sequelize.define(
        'PushNotificationToken',
        pushNotificationTokenSchema,
        {
            tableName: TABLE_NAMES.push_notification_tokens,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );
export const BookingAvailability = sequelize.isDefined('BookingAvailability')
    ? sequelize.models.BookingAvailability
    : sequelize.define(
        'BookingAvailability',
        bookingAvailabilitySchema,
        {
            tableName: TABLE_NAMES.booking_availability,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

User.hasOne(UserInformation, {
    foreignKey: 'user_id',
    as: 'user_information',
});

UserInformation.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

User.hasMany(Idea, {
    foreignKey: 'user_id',
    as: 'ideas'
});

Idea.belongsTo(User, {
    foreignKey: 'user_id',
});

User.hasMany(Booking, {
    foreignKey: 'creator_id',
});

// Booking.belongsTo(User, {
//     foreignKey: 'creator_id',
// })
Booking.belongsTo(User, { as: 'creator', foreignKey: 'creator_id' });
Booking.belongsTo(User, { as: 'participant', foreignKey: 'participant_id' });

User.hasMany(Form, {
    foreignKey: 'creator_id',
});

User.hasMany(FormResponses, {
    foreignKey: 'responder_id',
});

Form.belongsTo(User, {
    foreignKey: 'creator_id',
    as: 'user',
});

FormResponses.belongsTo(User, {
    foreignKey: 'responder_id',
});

Form.belongsTo(Idea, {
    foreignKey: 'idea_id',
    as: 'idea',
});

User.hasMany(Otp, {
    foreignKey: 'user_id',
    as: 'otpUser',
})

Otp.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// LensSelection associations
Idea.hasMany(LensSelection, {
    foreignKey: 'idea_id',
    as: 'lens_selections'
});

LensSelection.belongsTo(Idea, {
    foreignKey: 'idea_id',
    as: 'idea'
});

// SmeSelection associations
Idea.hasMany(SmeSelection, {
    foreignKey: 'idea_id',
    as: 'sme_selections'
});

SmeSelection.belongsTo(Idea, {
    foreignKey: 'idea_id',
    as: 'idea'
});

User.hasMany(SmeSelection, {
    foreignKey: 'user_id',
    as: 'sme_selections'
});

SmeSelection.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// UserSelection associations
Idea.hasMany(UserSelection, {
    foreignKey: 'idea_id',
    as: 'user_selections'
});

UserSelection.belongsTo(Idea, {
    foreignKey: 'idea_id',
    as: 'idea'
});

User.hasMany(UserSelection, {
    foreignKey: 'user_id',
    as: 'user_selections'
});

UserSelection.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

Form.hasMany(FormResponses, {
    foreignKey: 'form_id',
    as: 'form_responses'  // Give it an alias
});

User.hasMany(PushNotificationToken, {
    foreignKey: 'user_id',
    as: 'push_tokens'
});

PushNotificationToken.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// BookingAvailability associations
User.hasMany(BookingAvailability, {
    foreignKey: 'user_id',
    as: 'availabilities'
});

BookingAvailability.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});
// Add these after the existing Booking associations
Booking.belongsTo(Idea, {
    foreignKey: 'idea_id',
    as: 'idea'
});

Idea.hasMany(Booking, {
    foreignKey: 'idea_id',
    as: 'bookings'
});

export let cache = null;

let ready = false;
export async function init(requestId) {
    if (ready) return;
    await sequelize.authenticate();
    let cacheReady = false;
    // if (!cache) {
    //     cache = new Redis({
    //         port: Number(process.env.REDIS_PORT || 6379),
    //         host: process.env.REDIS_HOST,
    //         connectTimeout: 5000,
    //         tls: {}
    //     });
    //
    //     const pong = await cache.ping();
    //     console.log('Ping Received: ', pong);
    //
    //     if (pong) {
    //         cacheReady = true;
    //     }
    // }
    logger.debug('pool.js','init',requestId, {
       dbInit: true,
       cacheInit: cacheReady
    })
    ready = true;
}

export default sequelize;
