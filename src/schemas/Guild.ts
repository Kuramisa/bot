import { Document, model, Schema, HydratedDocument, Types } from "mongoose";

export interface IGuild extends HydratedDocument<any> {
    id: string;
    name: string;
    prefix: string;
    promoted: boolean;
    channels: {
        rules: string;
        reports: string;
    };
    roles: {
        member: string;
        joined: string;
    };
    logs: {
        channel: string;
        types: {
            memberWarned: boolean;
            memberReported: boolean;
            memberJoin: boolean;
            memberLeave: boolean;
            memberBoost: boolean;
            memberUnboost: boolean;
            memberRoleAdded: boolean;
            memberRoleRemoved: boolean;
            memberNicknameChange: boolean;
            messageDeleted: boolean;
            messageEdited: boolean;
        };
    };
    welcomeMessage: {
        enabled: boolean;
        channel: string;
        card: {
            type: "banner" | "color" | "image" | "icon";
            color: string;
            image: Buffer | string;
        };
    };
    goodbyeMessage: {
        enabled: boolean;
        channel: string;
        card: {
            type: "banner" | "color" | "image" | "icon";
            color: string;
            image: Buffer | string;
        };
    };
    toggles: {
        nsfwFilter: boolean;
    };
    tickets: {
        category: string;
        message: string;
        channels: {
            openTicket: string;
            transcripts: string;
        };
        buttons: string[];
    };
}

export const Guild: Schema = new Schema<IGuild>({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    prefix: {
        type: String,
        default: "k!"
    },
    promoted: Boolean,
    channels: {
        rules: String,
        reports: String
    },
    roles: {
        member: String,
        joined: String
    },
    logs: {
        channel: String,
        types: {
            memberWarned: Boolean,
            memberReported: Boolean,
            memberJoin: Boolean,
            memberLeave: Boolean,
            memberBoost: Boolean,
            memberUnboost: Boolean,
            memberRoleAdded: Boolean,
            memberRoleRemoved: Boolean,
            memberNicknameChange: Boolean,
            messageDeleted: Boolean,
            messageEdited: Boolean
        }
    },
    welcomeMessage: {
        enabled: Boolean,
        channel: String,
        card: {
            type: {
                type: String,
                default: "color"
            },
            color: {
                type: String,
                default: "#D18700"
            },
            image: Schema.Types.Mixed
        }
    },
    goodbyeMessage: {
        enabled: Boolean,
        channel: String,
        card: {
            type: {
                type: String,
                default: "color"
            },
            color: {
                type: String,
                default: "#D18700"
            },
            image: Schema.Types.Mixed
        }
    },
    toggles: {
        justJoined: Boolean,
        nsfwFilter: Boolean
    },
    tickets: {
        category: String,
        message: String,
        channels: {
            openTicket: String,
            transcripts: String
        },
        buttons: []
    }
});

export type DGuild = Document<unknown, any, IGuild> &
    IGuild & {
        _id: Types.ObjectId;
    };

const name = "guilds";

export default model<IGuild>(name, Guild, name);
