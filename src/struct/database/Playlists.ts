import Playlist from "#schemas/Playlist";
import { GuildMember } from "discord.js";

export default class DatabasePlaylists {
    create = async ({ member, name }: { member: GuildMember; name: string }) =>
        await (
            await Playlist.create({
                memberId: member.id,
                name
            })
        ).save();

    get = async (memberId: string, name: string) =>
        await Playlist.findOne({ memberId, name });
    getAll = async (memberId?: string) =>
        memberId ? await Playlist.find({ memberId }) : await Playlist.find();

    delete = async (memberId: string, name: string) =>
        await Playlist.deleteOne({ memberId, name });
}
