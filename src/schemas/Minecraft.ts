import { Document, model, Schema, HydratedDocument, Types } from "mongoose";

export interface IMinecraft extends HydratedDocument<any> {
    code: string;
    guildId: string;
    ip: string;
    logs: {
        channel: string;
        chat: boolean;
    };
}

export const Minecraft: Schema = new Schema<IMinecraft>({
    code: String,
    guildId: String,
    ip: String,
    logs: {
        channel: String,
        chat: Boolean
    }
});

export type DMinecraft = Document<unknown, any, IMinecraft> &
    IMinecraft & {
        _id: Types.ObjectId;
    };

const name = "minecraft";

export default model<IMinecraft>(name, Minecraft, name);
