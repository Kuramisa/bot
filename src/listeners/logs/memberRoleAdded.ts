import { Listener } from "@sapphire/framework";
import { GuildMember, Role } from "discord.js";

export class MemberRoleAddLogListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Log when member receives a role",
            event: "guildMemberRoleAdd"
        });
    }

    async run(member: GuildMember, role: Role) {
        if (member.user.bot) return;

        const { database, util } = this.container;

        const { guild } = member;
        const db = await database.guilds.get(guild);
        if (!db || !db.logs.channel || !db.logs.types.memberRoleAdded) return;

        const channel = guild.channels.cache.get(db.logs.channel);
        if (!channel || !channel.isText()) return;

        if (guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

        const embed = util
            .embed()
            .setAuthor({
                name: `${guild.name} Member Logs`,
                iconURL: guild.iconURL() as string
            })
            .setThumbnail(member.displayAvatarURL())
            .setDescription(`${role} *was added to* ${member}`);

        return channel.send({ embeds: [embed] });
    }
}
