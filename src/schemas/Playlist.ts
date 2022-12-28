import { HydratedDocument, model, Schema } from "mongoose";
import { RawTrackData } from "@mateie/discord-player";

export interface IPlaylist extends HydratedDocument<any> {
    userId: string;
    name: string;
    tracks: RawTrackData[];
    sharedWith: string[];
}

export const Playlist = new Schema<IPlaylist>({
    userId: String,
    name: String,
    tracks: [],
    sharedWith: [],
});

export default model<IPlaylist>("playlists", Playlist);
