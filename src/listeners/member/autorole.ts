import { Listener } from "@sapphire/framework";
import { GuildMember } from "discord.js";

export class AutoRoleMemberAdd extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Autorole listener",
            event: "guildMemberAdd",
        });
    }

    async run(member: GuildMember) {
        const { database } = this.container;
        const { guild } = member;

        const db = await database.guilds.get(guild);

        if (db.autorole.length === 0) return;

        for (const role of db.autorole) {
            await member.roles.add(role);
        }
    }
}
