import { Document, HydratedDocument, model, Schema, Types } from "mongoose";

export interface IItem extends HydratedDocument<any> {
    id: string;
    name: string;
    description: string;
    usage: string;
    price?: number;
    amount?: number;
    emoji?: string;
}

export const Item: Schema = new Schema<IItem>(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        usage: {
            type: String,
            required: true,
        },
        price: Number,
        amount: Number,
        emoji: String,
    },
    { _id: false }
);

export type TItem = Document<unknown, any, IItem> &
    IItem & { _id: Types.ObjectId };

export default model<IItem>("items", Item);
