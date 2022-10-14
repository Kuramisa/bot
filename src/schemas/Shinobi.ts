import { Document, HydratedDocument, model, Schema, Types } from "mongoose";
import {
    ShinobiStats,
    ShinobiWeapon,
    ShinobiCurrencies,
    ShinobiRanks
} from "@types";

export interface IShinobi extends HydratedDocument<any> {
    memberId: string;
    username: string;
    clan: string;
    village: string;
    rank: ShinobiRanks;
    xp: number;
    level: number;
    stats: ShinobiStats;
    currencies: ShinobiCurrencies;
    weapons: ShinobiWeapon[];
    equipped: {
        weapon: ShinobiWeapon | null;
    };
    cooldowns: {
        daily: number;
        weekly: number;
    };
}

export const Shinobi: Schema = new Schema<IShinobi>({
    memberId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    clan: {
        type: String,
        required: true
    },
    village: {
        type: String,
        required: true
    },
    rank: {
        type: String,
        default: "genin"
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 0
    },
    currencies: {
        ryo: {
            type: Number,
            default: 0
        }
    },
    stats: {},
    weapons: [],
    equipped: {
        weapon: {}
    },
    cooldowns: {
        daily: {
            type: Number
        },
        weekly: {
            type: Number
        }
    }
});

export type DShinobi = Document<unknown, any, IShinobi> &
    IShinobi & {
        _id: Types.ObjectId;
    };

const name = "shinobis";

export default model<IShinobi>(name, Shinobi, name);
