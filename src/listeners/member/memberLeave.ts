import { Listener } from "@sapphire/framework";
import { GuildMember } from "discord.js";

export class MemberLeaveListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Member Goodbye card",
            event: ""
        });
    }

    public async run(member: GuildMember) {
        if (member.user.bot) return;

        const { canvas, client, database } = this.container;

        const { guild } = member;

        const db = await database.guilds.get(guild);

        if (!db || !db.goodbyeMessage.enabled || !db.goodbyeMessage.channel)
            return;

        const channel = guild.channels.cache.get(db.goodbyeMessage.channel);

        if (!channel) return;
        if (channel.type !== "GUILD_TEXT") return;

        if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

        const attachment = await canvas.goodbye.card(member);
        if (!attachment) return;

        if (!guild.me.permissions.has("MANAGE_WEBHOOKS"))
            return channel.send({ files: [attachment] });

        const webhook = await channel.createWebhook(
            `${member.displayName} Left the Server`,
            {
                avatar: client.user?.displayAvatarURL({ dynamic: true })
            }
        );

        await webhook.send({ files: [attachment] });

        await webhook.delete();
    }
}
