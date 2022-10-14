import { Listener } from "@sapphire/framework";
import { GuildMember } from "discord.js";

export class DestoryQueueMusicListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Destroy the queue when the bot leaves",
            event: "voiceChannelLeave"
        });
    }

    public async run(member: GuildMember) {
        const { client, music } = this.container;

        if (member.id !== client.user?.id) return;

        const queue = music.getQueue(member.guild);

        if (queue) queue.destroy();
    }
}
