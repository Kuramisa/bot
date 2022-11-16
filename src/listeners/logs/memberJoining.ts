import { Listener } from "@sapphire/framework";
import { GuildMember } from "discord.js";

export class MemberJoiningLogListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Log when member joins",
            event: "guildMemberAdd"
        });
    }

    async run(member: GuildMember) {
        if (member.user.bot) return;

        const { database, util } = this.container;

        const { guild } = member;
        const db = await database.guilds.get(guild);
        if (!db || !db.logs.channel || !db.logs.types.memberJoin) return;

        const channel = guild.channels.cache.get(db.logs.channel);
        if (!channel || !channel?.isText()) return;

        if (guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

        const embed = util
            .embed()
            .setAuthor({
                name: `${guild.name} Member Logs`,
                iconURL: guild.iconURL() as string
            })
            .setThumbnail(member.displayAvatarURL())
            .setDescription(`${member} **Joined**`)
            .addFields(
                {
                    name: "Joined Server",
                    value: `<t:${Math.floor(
                        (member.joinedTimestamp as number) / 1000
                    )}:R>`,
                    inline: true
                },
                {
                    name: "Joined Discord",
                    value: `<t:${Math.floor(
                        (member.user.createdTimestamp as number) / 1000
                    )}:R>`,
                    inline: true
                }
            )
            .setFooter({ text: `ID: ${member.id}` });

        return channel.send({ embeds: [embed] });
    }
}
