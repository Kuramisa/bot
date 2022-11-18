import { Listener } from "@sapphire/framework";
import { GuildMember, Role } from "discord.js";

export class MemberRoleRemovedListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Logs when role is removed from a member",
            event: "guildMemberRoleRemove"
        });
    }

    async run(member: GuildMember, role: Role) {
        if (member.user.bot) return;

        const { database, util } = this.container;

        const { guild } = member;
        const db = await database.guilds.get(guild);
        if (!db || !db.logs.channel || !db.logs.types.memberRoleRemoved) return;

        const channel = guild.channels.cache.get(db.logs.channel);
        if (!channel || !channel.isTextBased()) return;

        if (guild.members.me?.permissionsIn(channel).has("SendMessages"))
            return;

        const embed = util
            .embed()
            .setAuthor({
                name: `${guild.name} Member Logs`,
                iconURL: guild.iconURL() as string
            })
            .setThumbnail(member.displayAvatarURL())
            .setDescription(`${role} *was removed from* ${member}`);

        return channel.send({ embeds: [embed] });
    }
}
