import { Listener } from "@sapphire/framework";
import { Message } from "discord.js";

export class MediaFilterListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Filter Media from messages",
            event: "messageCreate",
        });
    }

    async run(message: Message) {
        const { database } = this.container;
        const { channel, guild } = message;
        if (!channel || !guild) return;

        const db = await database.guilds.get(guild);

        if (!db.filters.media.enabled) return;

        const { util } = this.container;

        if (!util.containsURL(message.content)) return;

        const url = util.extractURL(message.content);
        if (!url) return;

        console.log(url);
    }
}
