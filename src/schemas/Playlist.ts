import { Document, HydratedDocument, model, Schema, Types } from "mongoose";
import { RawTrackData } from "@mateie/discord-player";

export interface IPlaylist extends HydratedDocument<any> {
    memberId: string;
    name: string;
    tracks: RawTrackData[];
    sharedWith: string[];
}

export const Playlist: Schema = new Schema<IPlaylist>({
    memberId: String,
    name: String,
    tracks: [],
    sharedWith: []
});

export type DPlaylist = Document<unknown, any, IPlaylist> &
    IPlaylist & {
        _id: Types.ObjectId;
    };

const name = "playlists";

export default model<IPlaylist>(name, Playlist, name);
