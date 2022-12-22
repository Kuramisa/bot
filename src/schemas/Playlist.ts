import { HydratedDocument, model, Schema } from "mongoose";
import { RawTrackData } from "@mateie/discord-player";

export interface IPlaylist extends HydratedDocument<any> {
    memberId: string;
    name: string;
    tracks: RawTrackData[];
    sharedWith: string[];
}

export const Playlist = new Schema<IPlaylist>({
    memberId: String,
    name: String,
    tracks: [],
    sharedWith: [],
});

export default model<IPlaylist>("playlists", Playlist);
