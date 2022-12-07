import { Listener } from "@sapphire/framework";
import { ChannelType, GuildMember } from "discord.js";

export class MemberJoinListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Member Welcome card",
            event: "guildMemberAdd",
        });
    }

    async run(member: GuildMember) {
        if (member.user.bot) return;

        const { canvas, client, database } = this.container;

        const { guild } = member;

        const db = await database.guilds.get(guild);

        await database.users.verify(member.user);

        if (!db || !db.welcomeMessage.enabled || !db.welcomeMessage.channel)
            return;

        const channel = guild.channels.cache.get(db.welcomeMessage.channel);

        if (!channel) return;
        if (channel.type !== ChannelType.GuildText) return;

        if (!guild.members.me?.permissionsIn(channel).has("SendMessages"))
            return;

        const attachment = await canvas.welcome.card(member);
        if (!attachment) return;

        if (!guild.members.me.permissions.has("ManageWebhooks"))
            return channel.send({ files: [attachment] });

        const webhook = await channel.createWebhook({
            name: `${member.displayName} Joined the Server`,
            avatar: client.user?.displayAvatarURL({ extension: "gif" }),
        });

        await webhook.send({ files: [attachment] });

        await webhook.delete();
    }
}
