import { Listener } from "@sapphire/framework";
import { ButtonInteraction } from "discord.js";

export class CreatePasteWarframeListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Create a pa ste from Warframe.market embed",
            event: "interactionCreate"
        });
    }

    async run(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "create_paste") return;

        const { message } = interaction;

        const embed = message.embeds[0];

        const type = embed.title?.split("Orders for")[0].trim().toLowerCase();
        const user = embed
            .fields![0].value.split("`Reputation`")[0]
            .split(":")[1]
            .trim();
        const item = embed.title?.split("Orders for")[1].trim();
        const price = embed.description
            ?.split("(each)")[0]
            .split(":")[1]
            .trim();

        return interaction.reply({
            content: `/w ${user} Hi! I want to ${
                type === "sell" ? "buy" : "sell"
            }: ${item} for ${price} platinum. (warframe.market)`,
            ephemeral: true
        });
    }
}
