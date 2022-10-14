import { Listener } from "@sapphire/framework";
import { GuildMember } from "discord.js";

export class MemberJoinListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Member Welcome card",
            event: "guildMemberAdd"
        });
    }

    public async run(member: GuildMember) {
        if (member.user.bot) return;

        const { canvas, client, database } = this.container;

        const { guild } = member;

        const db = await database.guilds.get(guild);

        database.users.verify(member.user);

        if (!db || !db.welcomeMessage.enabled || !db.welcomeMessage.channel)
            return;

        const channel = guild.channels.cache.get(db.welcomeMessage.channel);

        if (!channel) return;
        if (channel.type !== "GUILD_TEXT") return;

        if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

        const attachment = await canvas.welcome.card(member);
        if (!attachment) return;

        if (!guild.me.permissions.has("MANAGE_WEBHOOKS"))
            return channel.send({ files: [attachment] });

        const webhook = await channel.createWebhook(
            `${member.displayName} Joined the Server`,
            {
                avatar: client.user?.displayAvatarURL({ dynamic: true })
            }
        );

        await webhook.send({ files: [attachment] });

        await webhook.delete();
    }
}
