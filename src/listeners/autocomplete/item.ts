import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";
import Item from "#schemas/Item";

export class HelpACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Item Autocomplete",
            event: "interactionCreate",
        });
    }

    async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "item") return;

        const { options } = interaction;

        const focused = options.getFocused();

        let items = await Item.find();

        if (focused.length > 0)
            items = items.filter((item) => item.name.includes(focused));
        else items = items.filter((_, i) => i < 25);

        return interaction.respond(
            items.map((item) => ({
                name: `${item.name} - ${item.description}`,
                value: `${item.name}:${item.id}`,
            }))
        );
    }
}
