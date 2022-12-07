import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class SettingsACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Settings Autocomplete",
            event: "interactionCreate",
        });
    }

    async run(interaction: AutocompleteInteraction<"cached">) {
        if (!interaction.isAutocomplete()) return;

        const { database, util } = this.container;

        const { options, guild, commandName } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const focused = options.getFocused();

        switch (commandName) {
            case "roles": {
                let roles = Object.keys(db.roles);

                if (focused.length > 0)
                    roles = roles.filter((role) => role.startsWith(focused));

                return await interaction.respond(
                    roles.map((choice) => ({
                        name: util.capFirstLetter(choice),
                        value: choice,
                    }))
                );
            }
            case "channels": {
                let channels = Object.keys(db.channels);

                if (focused.length > 0)
                    channels = channels.filter((channel) =>
                        channel.startsWith(focused)
                    );

                await interaction.respond(
                    channels.map((choice) => ({
                        name: util.capFirstLetter(choice),
                        value: choice,
                    }))
                );
                break;
            }
            case "toggles": {
                let toggles = Object.keys(db.toggles).map((string) =>
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
