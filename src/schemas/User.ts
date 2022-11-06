import { Document, HydratedDocument, model, Schema, Types } from "mongoose";

export interface IUser extends HydratedDocument<any> {
    id: string;
    username: string;
    premium: boolean;
    betaTester: boolean;
    minecraft: {
        code: string | null;
        username: string | null;
    };
    xp: number;
    level: number;
    valorant: {
        name: string | null | undefined;
        tag: string | null | undefined;
        puuid: string | null | undefined;
    };
    card: {
        background: {
            type: "banner" | "color" | "image";
            color: string;
            image: Buffer;
        };
        outlines: {
            type: "banner" | "avatar" | "color";
            color: string;
        };
        text: {
            type: "banner" | "avatar" | "color";
            color: string;
        };
    };
    marriage: {
        married: boolean;
        to: string;
        since: number;
    };
    warns: {
        guildId: string;
        by: string;
        reason: string;
    }[];
    reports: {
        guildId: string;
        by: string;
        reason: string;
    }[];
}

export const User: Schema = new Schema<IUser>({
    id: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    premium: {
        type: Boolean,
        default: false
    },
    betaTester: {
        type: Boolean,
        default: false
    },
    minecraft: {
        code: String,
        username: String
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 0
    },
    valorant: {
        name: String,
        tag: String,
        puuid: String
    },
    card: {
        background: {
            type: {
                type: String,
                default: "color"
            },
            color: {
                type: String,
                default: "#D18700"
            },
            image: Buffer
        },
        outlines: {
            type: {
                type: String,
                default: "avatar"
            },
            color: {
                type: String,
                default: "#222216"
            }
        },
        text: {
            type: {
                type: String,
                default: "color"
            },
            color: {
                type: String,
                default: "#ffffff"
            }
        }
    },
    marriage: {
        married: {
            type: Boolean,
            default: false
        },
        to: String,
        since: Number
    },
    warns: [
        {
            guildId: String,
            by: String,
            reason: String
        }
    ],
    reports: [
        {
            guildId: String,
            by: String,
            reason: String
        }
    ]
});

export type TUser = Document<unknown, any, IUser> &
    IUser & {
        _id: Types.ObjectId;
    };

export default model<IUser>("users", User);
