import { Document, HydratedDocument, model, Schema, Types } from "mongoose";
import { RawTrackData } from "discord-player";

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

export type TPlaylist = Document<unknown, any, IPlaylist> &
    IPlaylist & {
        _id: Types.ObjectId;
    };

export default model<IPlaylist>("playlists", Playlist);
