// src/admin-login.js - Updated to use database
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { getUser } from './user/crud.js'; // Import your existing getUser function
import { logger } from './logger/logger.js';
import { loginValidation } from './joi/validation.js';
import { UserInformation } from './db/pool.js';

config();
const FILE_NAME = 'admin-login.js';

export async function adminLogin(body) {
    const requestId = body.requestId;
    delete body.requestId;

    try {
        const { headerError, bodyError } = loginValidation(body);
        if (headerError || bodyError) {
            return {
                statusCode: 400,
                body: {
                    message: 'Oops! Something went wrong.',
                    error: 'Invalid payload ' + (headerError || bodyError.details.map(d => d.message).join('; '))
                }
            }
        }

        const { email, password } = body;

        // Query database for admin user (simplified)
        const userDataFromDB = await getUser(
            {
                email,
                persona_type: 'admin' // Only look for admin users
            },
            [{
                model: UserInformation,
                as: 'user_information',
                required: false
            }],
            ['id', 'email', 'password', 'persona_type'],
            requestId
        );

        // Check if admin user exists
        if (userDataFromDB.error) {
            return {
                statusCode: 401,
                body: { 
                    message: 'Invalid admin credentials!' 
                }
            }
        }

        const userData = userDataFromDB.data.user;

        // Verify password against database
        const isValidPassword = bcrypt.compareSync(password, userData.password);
        
        if (!isValidPassword) {
            return {
                statusCode: 401,
                body: { 
                    message: 'Invalid admin credentials!' 
                }
            }
        }

        // Generate JWT token with real user data
        const token = jwt.sign(
            {
                userId: userData.id,     // Real user ID from database
                email: userData.email,
                role: 'admin',
                isAdmin: true,
                persona_type: 'admin'
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: process.env.JWT_EXPIRY || '24h'
            }
        );

        return {
            statusCode: 200,
            body: {
                token,
                user: {
                    id: userData.id,
                    email: userData.email,
                    role: 'admin',
                    isAdmin: true,
                    name: userData.user_information?.name
                },
                message: 'Admin login successful'
            }
        }

    } catch (error) {
        logger.error(FILE_NAME, 'adminLogin', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Cannot login.'
            }
        }
    }
}