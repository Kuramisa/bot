import { Listener } from "@sapphire/framework";
import { ButtonInteraction, Message } from "discord.js";

export class DismissAnnoucementListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Button for Dismissing the announcement",
            event: "interactionCreate"
        });
    }

    public async run(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "dismiss-announcement") return;
        const message = interaction.message as Message;
        if (message.inGuild()) return;

        await message.delete().catch(console.error);
    }
}
