import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class HelpACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Game Autocomplete",
            event: "interactionCreate"
        });
    }

    public async run(interaction: AutocompleteInteraction<"cached">) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "game") return;

        const { database } = this.container;
        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const focused = options.getFocused(true);

        switch (focused.name) {
            case "game_to_setup":
            case "game_to_remove":
            case "game_to_reset": {
                let games = db.games.list;

                if (focused.value.length > 0)
                    games = games.filter(
                        (game) =>
                            game.toLowerCase() === focused.value.toLowerCase()
                    );

                return interaction.respond(
                    games.map((game) => ({
                        name: game,
                        value: game
                    }))
                );
            }
        }
    }
}
