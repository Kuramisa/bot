import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class WarframeACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Warframe Autocomplete",
            event: "interactionCreate"
        });
    }

    async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "warframe") return;

        return this.container.games.warframe.itemAutocomplete(interaction);
    }
}
