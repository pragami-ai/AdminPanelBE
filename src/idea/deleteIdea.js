import { config } from 'dotenv';
import { Idea, LensSelection, UserSelection, Form, FormResponses } from '../db/pool.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/idea/deleteIdea.js';

export async function adminDeleteIdea(body) {
    const { ideaId, requestId } = body;
    delete body.requestId;
    
    try {
        // Validate required fields
        if (!ideaId) {
            return {
                statusCode: 400,
                body: {
                    message: 'ideaId is required'
                }
            };
        }

        // Check if idea exists
        const existingIdea = await Idea.findOne({
            where: {
                id: ideaId
            }
        });

        if (!existingIdea) {
            return {
                statusCode: 404,
                body: {
                    message: 'Idea not found'
                }
            };
        }

        // Start transaction for safe deletion
        const transaction = await Idea.sequelize.transaction();

        try {
            // Delete related records in correct order (child tables first)
            
            // 1. Delete form responses (if any forms exist)
            const forms = await Form.findAll({
                where: { idea_id: ideaId },
                transaction
            });

            for (const form of forms) {
                await FormResponses.destroy({
                    where: { form_id: form.id },
                    transaction
                });
            }

            // 2. Delete forms
            await Form.destroy({
                where: { idea_id: ideaId },
                transaction
            });

            // 3. Delete user selections
            await UserSelection.destroy({
                where: { idea_id: ideaId },
                transaction
            });

            // 4. Delete lens selections
            await LensSelection.destroy({
                where: { idea_id: ideaId },
                transaction
            });

            // 5. Finally delete the idea
            await Idea.destroy({
                where: { id: ideaId },
                transaction
            });

            // Commit transaction
            await transaction.commit();

            logger.info(FILE_NAME, 'adminDeleteIdea', requestId, {
                ideaId,
                message: 'Idea and all related data deleted successfully'
            });

            return {
                statusCode: 200,
                body: {
                    message: 'Idea deleted successfully',
                    deletedIdeaId: ideaId
                }
            };

        } catch (transactionError) {
            // Rollback transaction on error
            await transaction.rollback();
            throw transactionError;
        }

    } catch (error) {
        logger.error(FILE_NAME, 'adminDeleteIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            ideaId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to delete idea'
            }
        };
    }
}