import {DataTypes} from "sequelize"
import {TABLE_NAMES} from "../../helper/constants.js"

export const bookingsSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        }
    },
    participant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        }
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    virtual_conference_id: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    transcript_url: {
        type: DataTypes.TEXT
    },
    video_recording_url: {
        type: DataTypes.TEXT
    },
    chime_meeting_response: {
        type: DataTypes.JSON
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    idea_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.ideas,
            key: 'id'
        }
    },
    ai_digest: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    // New fields for cancellation tracking
    is_cancel: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    cancel_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        }
    },
    cancel_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}
