import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class MusicSearchACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...ctx,
            name: "Music Search Autocomplete",
            event: "interactionCreate"
        });
    }

    async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "music") return;

        const {
            systems: { music },
            util
        } = this.container;

        const { options, user } = interaction;

        const focused = options.getFocused();

        switch (options.getSubcommand()) {
            case "play": {
                const result = await music.search(focused, {
                    requestedBy: user
                });

                if (result.playlist) {
                    const { author, title, tracks, source, type, url } =
                        result.playlist;

                    return interaction.respond([
                        {
                            name: `${title} by ${author.name} - ${
                                tracks.length
                            } Tracks - ${util.capFirstLetter(
                                source
                            )} ${util.capFirstLetter(type)}`,
                            value: url
                        }
                    ]);
                }

                const tracks = result.tracks.filter((_, i) => i <= 25);

                return interaction.respond(
                    tracks.map((track) => ({
                        name: `${util.shorten(
                            `${track.title} - ${track.author}`,
                            99
                        )}`,
                        value: `${util.shorten(
                            `${track.title} - ${track.author}`,
                            99
                        )}`
                    }))
                );
            }
        }
    }
}
