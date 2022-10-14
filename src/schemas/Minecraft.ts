import { Document, model, Schema, HydratedDocument, Types } from "mongoose";

export interface IMinecraft extends HydratedDocument<any> {
    guildId: string;
    logs: {
        chat: {
            enabled: boolean;
            channel: string;
        };
    };
}

export const Minecraft: Schema = new Schema<IMinecraft>({
    guildId: String,
    logs: {
        chat: {
            enabled: Boolean,
            channel: String
        }
    }
});

export type DMinecraft = Document<unknown, any, IMinecraft> &
    IMinecraft & {
        _id: Types.ObjectId;
    };

const name = "minecraft";

export default model<IMinecraft>(name, Minecraft, name);
