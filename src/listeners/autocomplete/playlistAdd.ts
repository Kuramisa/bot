import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class PlaylistAddACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Playlist Add Autocomplete",
            event: "interactionCreate"
        });
    }

    public async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "playlist") return;

        const {
            database,
            systems: { music },
            util
        } = this.container;

        const { options, user } = interaction;

        let playlists = await database.playlists.getAll(user.id);

        const focused = options.getFocused();

        switch (options.getFocused(true).name) {
            case "playlist_name": {
                if (focused.length > 0)
                    playlists = playlists.filter((playlist) =>
                        playlist.name.startsWith(focused)
                    );

                return interaction.respond(
                    playlists.map((playlist) => ({
                        name: `${playlist.name} - ${playlist.tracks.length} Tracks`,
                        value: playlist.name
                    }))
                );
            }
            case "query": {
                const result = await music.search(focused, {
                    requestedBy: interaction.user
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

                if (tracks.length < 1) return;

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
            case "playlist_url": {
                const result = await music.search(focused, {
                    requestedBy: interaction.user
                });

                if (!result.playlist) return;

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
        }
    }
}
