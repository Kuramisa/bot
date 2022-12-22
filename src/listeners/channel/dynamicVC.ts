import { Listener } from "@sapphire/framework";
import { ChannelType, VoiceState } from "discord.js";

export class DynamicVCListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Dynamic Voice Channels",
            event: "voiceStateUpdate",
        });
    }

    async run(_: VoiceState, state: VoiceState) {
        if (!state.channel) return;

        const { database } = this.container;
        const { guild, channel } = state;

        if (channel.type !== ChannelType.GuildVoice) return;

        const db = await database.guilds.get(guild);

        const dvc =
            db.dvc.find((vc) => vc.parent === channel.id) ||
            db.dvc.find((vc) => vc.channels.includes(channel.id));

        if (!dvc) return;

        const parentVC = guild.channels.cache.get(dvc.parent);
        if (!parentVC || parentVC.type !== ChannelType.GuildVoice) return;

        const newChannel = await guild.channels.create({
            name: `${parentVC.name} ${dvc.channels.length + 2}`,
            parent: channel.parent,
            position: channel.position + 1,
            type: ChannelType.GuildVoice,
        });

        dvc.channels.push(newChannel.id);
        db.markModified("dvc");
        await db.save();
    }
}
