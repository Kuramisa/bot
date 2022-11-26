import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction, GuildBasedChannel } from "discord.js";

export class DVCACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Dynamic Voice Channel Autocompletes",
            event: "interactionCreate"
        });
    }

    async run(interaction: AutocompleteInteraction<"cached">) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "dvc") return;

        const { database } = this.container;
        const { guild, options } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const focused = options.getFocused(true);

        switch (focused.name) {
            case "channel_to_undo": {
                let channels = db.dvc.map(
                    (vc) =>
                        guild.channels.cache.get(vc.parent) as GuildBasedChannel
                );

                if (focused.value.length > 0)
                    channels = channels.filter((ch) =>
                        ch.name
                            .toLowerCase()
                            .startsWith(focused.value.toLowerCase())
                    );

                return interaction.respond(
                    channels.map((ch) => ({ name: ch.name, value: ch.id }))
                );
            }
        }
    }
}
