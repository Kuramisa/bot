import { HydratedDocument, model, Schema } from "mongoose";
import { StaffType } from "@types";

export interface IStaff extends HydratedDocument<any> {
    id: string;
    description: string;
    type: StaffType;
}

export const Staff = new Schema<IStaff>({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        default: "helper",
    },
});

export default model<IStaff>("staff", Staff);
