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

    async run(oldState: VoiceState) {
        if (!oldState.channel) return;
        const { database } = this.container;
        const { guild, member, channel } = oldState;
        if (!member) return;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const dvc =
            db.dvc.find((vc) => vc.parent === channel.id) ||
            db.dvc.find((vc) => vc.channels.includes(channel.id));
    }
}
