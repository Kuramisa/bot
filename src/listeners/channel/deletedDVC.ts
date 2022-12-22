import { Listener } from "@sapphire/framework";
import { ChannelType, GuildChannel } from "discord.js";

export class DeletedDVCListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Remove channel from database",
            event: "channelDelete",
        });
    }

    async run(channel: GuildChannel) {
        if (channel.type !== ChannelType.GuildVoice) return;

        const { database } = this.container;
        const { guild } = channel;

        const db = await database.guilds.get(guild);

        const dvc =
            db.dvc.find((vc) => vc.parent === channel.id) ||
            db.dvc.find((vc) => vc.channels.includes(channel.id));

        if (!dvc) return;

        if (!dvc.channels.find((ch) => ch === channel.id)) return;

        dvc.channels = dvc.channels.filter((vc) => vc !== channel.id);

        db.markModified("dvc");
        await db.save();
    }
}
