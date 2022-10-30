import { Listener } from "@sapphire/framework";
import { checkPrimeSync } from "crypto";
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

        const { database, util } = this.container;
        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        let gameChosen = options.getString("game_to_use");
        const focused = options.getFocused(true);

        switch (focused.name) {
            case "game_to_use": {
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
            case "type_to_remove": {
                if (!gameChosen) return;
                if (!db.games.list.includes(gameChosen)) return;
                gameChosen = gameChosen.toLowerCase();
                let types = db.games.settings[gameChosen].types;

                if (focused.value.length > 0)
                    types = types.filter(
                        (type) =>
                            type.toLowerCase() === focused.value.toLowerCase()
                    );

                return interaction.respond(
                    types.map((type) => ({
                        name: util.capFirstLetter(type),
                        value: type
                    }))
                );
            }
        }
    }
}
