import { Listener } from "@sapphire/framework";
import { GuildMember } from "discord.js";

export class MemberUnboostLogListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Logs when member unboosts a server",
            event: "guildMemberUnboost"
        });
    }

    public async run(member: GuildMember) {
        if (member.user.bot) return;

        const { database, util } = this.container;

        const { guild } = member;
        const db = await database.guilds.get(guild);
        if (!db || !db.logs.channel || !db.logs.types.memberUnboost) return;

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
            .setDescription(`${member} *Removed the boost from the server*`);

        return channel.send({ embeds: [embed] });
    }
}
