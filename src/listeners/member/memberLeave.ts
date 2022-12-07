import { Listener } from "@sapphire/framework";
import { ChannelType, GuildMember } from "discord.js";

export class MemberLeaveListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Member Goodbye card",
            event: "",
        });
    }

    async run(member: GuildMember) {
        if (member.user.bot) return;

        const { canvas, client, database } = this.container;

        const { guild } = member;

        const db = await database.guilds.get(guild);

        if (!db || !db.goodbyeMessage.enabled || !db.goodbyeMessage.channel)
            return;

        const channel = guild.channels.cache.get(db.goodbyeMessage.channel);

        if (!channel) return;
        if (channel.type !== ChannelType.GuildText) return;

        if (!guild.members.me?.permissionsIn(channel).has("SendMessages"))
            return;

        const attachment = await canvas.goodbye.card(member);
        if (!attachment) return;

        if (!guild.members.me.permissions.has("ManageWebhooks"))
            return channel.send({ files: [attachment] });

        const webhook = await channel.createWebhook({
            name: `${member.displayName} Left the Server`,
            avatar: client.user?.displayAvatarURL({ extension: "gif" }),
        });

        await webhook.send({ files: [attachment] });

        await webhook.delete();
    }
}
