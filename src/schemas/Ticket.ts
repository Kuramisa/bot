import { Document, HydratedDocument, model, Schema, Types } from "mongoose";

export interface ITicket extends HydratedDocument<any> {
    guildId: string;
    memberId: string;
    ticketId: string;
    channelId: string;
    closed: boolean;
    locked: boolean;
    transcript: Buffer;
    type: string;
}

export const Ticket: Schema = new Schema<ITicket>({
    guildId: String,
    memberId: String,
    ticketId: String,
    channelId: String,
    closed: Boolean,
    locked: Boolean,
    transcript: Buffer,
    type: String,
});

export type TTicket = Document<unknown, any, ITicket> &
    ITicket & {
        _id: Types.ObjectId;
    };

export default model<ITicket>("tickets", Ticket);
