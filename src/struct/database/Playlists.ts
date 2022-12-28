import Playlist from "#schemas/Playlist";
import { User } from "discord.js";

export default class DatabasePlaylists {
    create = async ({ user, name }: { user: User; name: string }) =>
        Playlist.create({
            userId: user.id,
            name,
        });

    get = async (memberId: string, name: string) =>
        await Playlist.findOne({ memberId, name });
    getAll = async (memberId?: string) =>
        memberId ? await Playlist.find({ memberId }) : await Playlist.find();

    delete = async (memberId: string, name: string) =>
        await Playlist.deleteOne({ memberId, name });
}
