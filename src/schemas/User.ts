import { Currencies, IReport, IWarn } from "@types";
import { HydratedDocument, model, Schema } from "mongoose";
import { IItem } from "./Item";

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
    currencies: Currencies;
    inventory: {
        items: IItem[];
    };
    valorant: any;
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
    warns: IWarn[];
    reports: IReport[];
}

export const User: Schema = new Schema<IUser>({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
    },
    premium: {
        type: Boolean,
        default: false,
    },
    betaTester: {
        type: Boolean,
        default: false,
    },
    minecraft: {
        code: String,
        username: String,
    },
    xp: {
        type: Number,
        default: 0,
    },
    level: {
        type: Number,
        default: 0,
    },
    currencies: {
        ryo: {
            type: Number,
            default: 0,
        },
    },
    inventory: {
        items: [],
    },
    valorant: Object,
    card: {
        background: {
            type: {
                type: String,
                default: "color",
            },
            color: {
                type: String,
                default: "#D18700",
            },
            image: Buffer,
        },
        outlines: {
            type: {
                type: String,
                default: "avatar",
            },
            color: {
                type: String,
                default: "#222216",
            },
        },
        text: {
            type: {
                type: String,
                default: "color",
            },
            color: {
                type: String,
                default: "#ffffff",
            },
        },
    },
    marriage: {
        married: {
            type: Boolean,
            default: false,
        },
        to: String,
        since: Number,
    },
    warns: [
        {
            id: String,
            guildId: String,
            by: String,
            message: {
                id: String,
                content: String,
            },
            reason: String,
        },
    ],
    reports: [
        {
            id: String,
            guildId: String,
            by: String,
            reason: String,
        },
    ],
});

export default model<IUser>("users", User);
