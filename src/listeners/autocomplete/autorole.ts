import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class AutoRoleACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Autocomplete for Autorole",
            event: "interactionCreate",
        });
    }

    async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "autorole") return;

        const { database } = this.container;

        const { guild, options } = interaction;
        if (!guild) return;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const focused = options.getFocused(true);

        switch (focused.name) {
            case "role_to_remove": {
                let roles = db.autorole.map((role) =>
                    guild.roles.cache.get(role)
                );

                if (focused.value.length > 1)
                    roles = roles.filter((role) =>
                        role?.name.startsWith(focused.value)
                    );

                return interaction.respond(
                    roles.map((role) => ({
                        name: role ? role.name : "Unknown Role",
                        value: role ? role.id : "",
                    }))
                );
            }
        }
    }
}
