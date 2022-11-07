import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";
import Item from "#schemas/Item";

export class HelpACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Shop Autocomplete",
            event: "interactionCreate"
        });
    }

    public async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "shop") return;

        const { database } = this.container;

        const { options, user } = interaction;

        const db = await database.users.get(user);
        if (!db) return;

        const focused = options.getFocused(true);

        let userItems = db.items;
        let dbItems = await Item.find();

        if (focused.value.length > 0) {
            userItems = userItems.filter((item) =>
                item.name.includes(focused.value)
            );

            dbItems = dbItems.filter((item) =>
                item.name.includes(focused.value)
            );
        }

        switch (focused.name) {
            case "buyable_item": {
                dbItems = dbItems.filter((item) => item.price !== null);

                return interaction.respond(
                    dbItems.map((item) => ({
                        name: `${item.name} - ${item.price} Ryo`,
                        value: item.id
                    }))
                );
            }
            case "sellable_item": {
                userItems = userItems.filter((item) => item.price !== null);

                return interaction.respond(
                    userItems.map((item) => ({
                        name: `${item.name} - ${item.price! / 2} Ryo`,
                        value: item.id
                    }))
                );
            }
            case "discardable_item": {
                return interaction.respond(
                    userItems.map((item) => ({
                        name: item.name,
                        value: item.id
                    }))
                );
            }
        }
    }
}
