import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class PremiumGIveACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Premium Giving Autocomplete",
            event: "interactionCreate"
        });
    }

    public async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "premium") return;

        const { client } = this.container;
        const { options } = interaction;

        const focused = options.getFocused(true);

        switch (focused.name) {
            case "server":
                let guilds = client.guilds.cache.toJSON();

                if (focused.value.length < 1)
                    guilds = guilds.filter((_, i) => i < 25);

                return interaction.respond(
                    client.guilds.cache
                        .filter((guild) =>
                            guild.name
                                .toLowerCase()
                                .includes(focused.value.toLowerCase())
                        )
                        .map((guild) => ({
                            name: guild.name,
                            value: guild.id
                        }))
                );
            case "user":
                return interaction.respond(
                    client.users.cache
                        .filter((user) =>
                            user.tag
                                .toLowerCase()
                                .includes(focused.value.toLowerCase())
                        )
                        .map((user) => ({
                            name: user.tag,
                            value: user.id
                        }))
                );
        }
    }
}
