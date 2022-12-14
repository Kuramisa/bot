import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class LogsACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Logs Autocomplete",
            event: "interactionCreate",
        });
    }

    async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "logs") return;
        if (!interaction.inCachedGuild()) return;

        const { database, util } = this.container;
        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);

        const focused = options.getFocused();

        switch (options.getSubcommand()) {
            case "toggles": {
                let toggles = Object.keys(db.logs.types).map((string) =>
                    string.split(/(?=[A-Z])/).join(" ")
                );

                if (focused.length > 0)
                    toggles = toggles.filter((toggle) =>
                        toggle.startsWith(focused)
                    );

                return await interaction.respond(
                    toggles.map((choice) => ({
                        name: util.capFirstLetter(choice),
                        value: choice.split(" ").join(""),
                    }))
                );
            }
        }
    }
}
