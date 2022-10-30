import { Listener } from "@sapphire/framework";
import { Message } from "discord.js";

export class TicketingMessageDeletedListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Removes Buttons from the db if the message was deleted",
            event: "messageDelete"
        });
    }

    public async run(message: Message) {
        const { database } = this.container;
        const { guild } = message;
        if (!guild) return;

        const db = await database.guilds.get(guild);
        if (!db) return;

        if (message.id !== db.tickets.message) return;

        db.tickets.buttons = [];

        await db.save();
    }
}
