import { Document, HydratedDocument, model, Schema, Types } from "mongoose";

export interface IGiveaway extends HydratedDocument<any> {
    messageId: string;
    channelId: string;
    guildId: string;
    startAt: number;
    endAt: number;
    ended: boolean;
    winnerCount: number;
    prize: string;
    messages: {
        giveaway: string;
        giveawayEnded: string;
        title: string;
        inviteToParticipate: string;
        drawing: string;
        dropMessage: string;
        winMessage: any;
        embedFooter: any;
        noWinner: string;
        winners: string;
        endedAt: string;
        hostedBy: string;
    };
    thumbnail: string;
    image: string;
    hostedBy: string;
    winnerIds: { type: [string]; default: undefined };
    reaction: any;
    botsCanWin: boolean;
    embedColor: any;
    embedColorEnd: any;
    exemptPermissions: { type: []; default: undefined };
    exemptMembers: string;
    bonusEntries: string;
    extraData: any;
    lastChance: {
        enabled: boolean;
        content: string;
        threshold: number;
        embedColor: any;
    };
    pauseOptions: {
        isPaused: boolean;
        content: string;
        unPauseAfter: number;
        embedColor: any;
        durationAfterPause: number;
        infiniteDurationText: string;
    };
    isDrop: boolean;
    allowedMentions: {
        parse: { type: [string]; default: undefined };
        users: { type: [string]; default: undefined };
        roles: { type: [string]; default: undefined };
    };
}

export const Giveaway: Schema = new Schema<IGiveaway>(
    {
        messageId: String,
        channelId: String,
        guildId: String,
        startAt: Number,
        endAt: Number,
        ended: Boolean,
        winnerCount: Number,
        prize: String,
        messages: {
            giveaway: String,
            giveawayEnded: String,
            title: String,
            inviteToParticipate: String,
            drawing: String,
            dropMessage: String,
            winMessage: mongoose.Mixed,
            embedFooter: mongoose.Mixed,
            noWinner: String,
            winners: String,
            endedAt: String,
            hostedBy: String,
        },
        thumbnail: String,
        image: String,
        hostedBy: String,
        winnerIds: { type: [String], default: undefined },
        reaction: mongoose.Mixed,
        botsCanWin: Boolean,
        embedColor: mongoose.Mixed,
        embedColorEnd: mongoose.Mixed,
        exemptPermissions: { type: [], default: undefined },
        exemptMembers: String,
        bonusEntries: String,
        extraData: mongoose.Mixed,
        lastChance: {
            enabled: Boolean,
            content: String,
            threshold: Number,
            embedColor: mongoose.Mixed,
        },
        pauseOptions: {
            isPaused: Boolean,
            content: String,
            unPauseAfter: Number,
            embedColor: mongoose.Mixed,
            durationAfterPause: Number,
            infiniteDurationText: String,
        },
        isDrop: Boolean,
        allowedMentions: {
            parse: { type: [String], default: undefined },
            users: { type: [String], default: undefined },
            roles: { type: [String], default: undefined },
        },
    },
    { _id: false }
);

export type TGiveaway = Document<unknown, any, IGiveaway> &
    IGiveaway & {
        _id: Types.ObjectId;
    };

export default model<IGiveaway>("giveaways", Giveaway);
