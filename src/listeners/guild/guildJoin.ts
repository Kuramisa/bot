import { Listener } from "@sapphire/framework";
import { Guild } from "discord.js";

export class GuildJoinListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "WHen bot joins server",
            event: "guildCreate",
        });
    }

    async run(guild: Guild) {
        await this.container.database.guilds.verify(guild);
    }
}
