import { Listener } from "@sapphire/framework";
import { VoiceState } from "discord.js";

export class DeleteEmptyChannelListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Delete empty JTC channels",
            event: "voiceStateUpdate"
        });
    }

    public async run(oldState: VoiceState) {
        if (!oldState.channel) return;
        const { database } = this.container;
        const { guild, member, channel } = oldState;
        if (!member) return;
        if (!channel || !channel.parent) return;

        const db = await database.guilds.get(guild);
        if (!db) return;
        if (!db.games || !db.games.settings) return;

        const gameName = channel.parent.name;
        if (!Object.keys(db.games.settings).includes(gameName.toLowerCase()))
            return;

        const gameSettings = db.games.settings[gameName.toLowerCase()];

        if (
            !gameSettings.category ||
            !gameSettings.jtc.enabled ||
            !gameSettings.jtc.channel
        )
            return;

        if (channel.name.toLowerCase().includes("join to create")) return;

        if (channel.members.size < 1) await channel.delete();
    }
}
