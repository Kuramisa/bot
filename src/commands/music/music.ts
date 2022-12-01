import { Subcommand } from "@sapphire/plugin-subcommands";
import {
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction
} from "discord.js";

export class MusicCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "music",
            description: "Music System",
            subcommands: [
                { name: "play", messageRun: "messagePlay" },
                { name: "add", messageRun: "messageAdd" },
                { name: "actions", messageRun: "messageActions" },
                { name: "skip", messageRun: "messageSkip" },
                { name: "seek", messageRun: "messageSeek" },
                { name: "volume", messageRun: "messageVolume" }
            ]
        });
    }

    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .addSubcommand((command) =>
                    command
                        .setName("play")
                        .setDescription("Play Tracks")
                        .addStringOption((option) =>
                            option
                                .setName("query")
                                .setDescription("Track/Playlist URL or a name")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("add")
                        .setDescription("Add Tracks")
                        .addStringOption((option) =>
                            option
                                .setName("query")
                                .setDescription("Track/Playlist URL or a name")
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("actions")
                        .setDescription("Choose an action for the player")
                        .addStringOption((option) =>
                            option
                                .setName("action")
                                .setDescription("Action you want to perform")
                                .setChoices(
                                    { name: "📃Current Queue", value: "queue" },
                                    {
                                        name: "⏯ Pause/Resume",
                                        value: "pause/resume"
                                    },
                                    { name: "⏹ Stop", value: "stop" },
                                    {
                                        name: "🔀 Shuffle Queue",
                                        value: "shuffle"
                                    }
                                )
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("skip")
                        .setDescription("Skip a track/to a track")
                        .addNumberOption((option) =>
                            option
                                .setName("to")
                                .setDescription("Position of a track")
                                .setRequired(false)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("seek")
                        .setDescription("Seek to a certain duration")
                        .addStringOption((option) =>
                            option
                                .setName("duration")
                                .setDescription(
                                    "Duration to seek to (3:00, 1:03...)"
                                )
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("volume")
                        .setDescription("Change volume for the player")
                        .addIntegerOption((option) =>
                            option
                                .setName("percent")
                                .setDescription("Volume to set (0-100)")
                                .setRequired(true)
                                .setMinValue(0)
                                .setMaxValue(100)
                        )
                )
        );

        registry.registerContextMenuCommand((builder) =>
            builder.setName("Queue Track").setType(3)
        );
    }

    async chatInputRun(
        interaction: ChatInputCommandInteraction<"cached">
    ): Promise<any> {
        const {
            systems: { music },
            util
        } = this.container;

        const { options, guild, channel, member } = interaction;

        if (!channel) return;

        const voiceChannel = member.voice.channel;

        if (!voiceChannel)
            return interaction.reply({
                content:
                    "You must be in a voice channel to be able to use the music commands",
                ephemeral: true
            });

        if (
            guild.members.me?.voice.channelId &&
            voiceChannel.id !== guild.members.me.voice.channelId
        )
            return interaction.reply({
                content: `I'm already playing music in ${guild.members.me.voice.channel}`,
                ephemeral: true
            });

        if (member.voice.deaf)
            return interaction.reply({
                content: "You cannot play music when deafened",
                ephemeral: true
            });

        let queue = music.getQueue(guild);

        switch (options.getSubcommand()) {
            case "play": {
                await interaction.deferReply({
                    ephemeral: true
                });

                const query = options.getString("query", true);
                if (query.length < 1) {
                    await interaction.editReply({
                        content: "No tracks provided"
                    });

                    return;
                }

                const result = await music.search(query, {
                    requestedBy: interaction.user
                });

                if (result.tracks.length < 1) {
                    await interaction.editReply({
                        content: `Tracks with \`${query}\` was not found`
                    });

                    break;
                }

                if (!queue) {
                    queue = music.createQueue(guild, {
                        metadata: channel
                    });

                    try {
                        if (!queue.connection)
                            await queue.connect(voiceChannel);
                    } catch {
                        queue.destroy();
                        return interaction.reply({
                            content: "Could not join your voice channel",
                            ephemeral: true
                        });
                    }
                }

                if (result.playlist) {
                    const playlist = result.playlist;
                    queue.addTracks(playlist.tracks);
                    const embed = util
                        .embed()
                        .setAuthor({
                            name: playlist.author.name,
                            url: playlist.author.url
                        })
                        .setTitle(
                            `Queued a playlist - ${util.capFirstLetter(
                                playlist.source
                            )}`
                        )
                        .setThumbnail(playlist.thumbnail)
                        .setDescription(
                            `Title: ${playlist.title}${
                                playlist.description
                                    ? `Description: ${playlist.description}`
                                    : ""
                            }`
                        )
                        .setURL(playlist.url);
                    await interaction.editReply({
                        embeds: [embed]
                    });
                } else {
                    const track = result.tracks[0];

                    queue.addTrack(track);

                    const embed = util
                        .embed()
                        .setTitle("Queued Track")
                        .setDescription(
                            `${track.title} - ${track.author} | ${track.duration}`
                        )
                        .setThumbnail(track.thumbnail);

                    await interaction.editReply({
                        embeds: [embed],
                        components: []
                    });
                }

                if (!queue.playing) await queue.play();
                break;
            }
            case "add": {
                await interaction.deferReply({
                    ephemeral: true
                });

                const query = options.getString("query", true);

                const result = await music.search(query, {
                    requestedBy: interaction.user
                });

                if (result.tracks.length < 1) {
                    await interaction.editReply({
                        content: `Tracks with \`${query}\` was not found`
                    });

                    break;
                }

                if (!queue) {
                    queue = music.createQueue(guild, {
                        metadata: channel
                    });

                    try {
                        if (!queue.connection)
                            await queue.connect(voiceChannel);
                    } catch {
                        queue.destroy();
                        return interaction.reply({
                            content: "Could not join your voice channel",
                            ephemeral: true
                        });
                    }
                }

                if (result.playlist) {
                    const playlist = result.playlist;
                    queue.addTracks(playlist.tracks);

                    const embed = util
                        .embed()
                        .setAuthor({
                            name: playlist.author.name,
                            url: playlist.author.url
                        })
                        .setTitle(
                            `Queued a playlist - ${util.capFirstLetter(
                                playlist.source
                            )}`
                        )
                        .setThumbnail(playlist.thumbnail)
                        .setDescription(
                            `Title: ${playlist.title}${
                                playlist.description
                                    ? `Description: ${playlist.description}`
                                    : ""
                            }`
                        )
                        .setURL(playlist.url);

                    await interaction.editReply({
                        embeds: [embed]
                    });
                } else {
                    const tracksChosen = await music.selectTrack(
                        interaction,
                        result.tracks
                    );
                    queue.addTracks(tracksChosen);

                    const embed = util.embed().setTitle("Queued Tracks")
                        .setDescription(`
                        ${tracksChosen
                            .map(
                                (track, index) =>
                                    `\`${index + 1}\`. ${track.title} - ${
                                        track.author
                                    } | ${track.duration}`
                            )
                            .join(",\n")}
                        `);

                    await interaction.editReply({
                        embeds: [embed],
                        components: []
                    });
                }

                if (!queue.playing) await queue.play();
                break;
            }
            case "actions": {
                if (!queue)
                    return interaction.reply({
                        content: "Music is not playing",
                        ephemeral: true
                    });

                const action = options.getString("action", true);
                switch (action) {
                    case "pause/resume": {
                        if (queue.connection.paused) {
                            await queue.play();

                            return interaction.reply({
                                content: "▶ Track Resumed",
                                ephemeral: true
                            });
                        }

                        queue.setPaused(true);

                        return interaction.reply({
                            content: "⏸ Track Paused",
                            ephemeral: true
                        });
                    }
                    case "stop": {
                        if (!member.permissions.has("MoveMembers"))
                            return interaction.reply({
                                content:
                                    "You cannot stop the player, not enough permissions",
                                ephemeral: true
                            });

                        queue.stop();
                        return interaction.reply({
                            content: "Music has been stopped",
                            ephemeral: true
                        });
                    }
                    case "queue": {
                        const mapped = queue.tracks.map((track, index) => {
                            return `\`${index + 1}\`. ${track.title} - ${
                                track.author
                            } | ${track.duration}`;
                        });

                        const chunked = util.chunk(mapped, 10);

                        if (chunked.length < 1)
                            return interaction.reply({
                                content: "There are no upcoming tracks",
                                ephemeral: true
                            });

                        await util.pagination.default(
                            interaction,
                            chunked,
                            "Upcoming Tracks"
                        );
                        break;
                    }
                    case "shuffle": {
                        if (queue.tracks.length < 2)
                            return interaction.reply({
                                content: "There are no upcoming tracks",
                                ephemeral: true
                            });

                        queue.shuffle();

                        return interaction.reply({
                            content: "Queue shuffled",
                            ephemeral: true
                        });
                    }
                }
                break;
            }
            case "skip": {
                if (!queue)
                    return interaction.reply({
                        content: "Music is not playing",
                        ephemeral: true
                    });
                if (queue.tracks.length < 1) {
                    return interaction.reply({
                        content: "There are no upcoming tracks to skip to",
                        ephemeral: true
                    });
                }

                const currentTrack = queue.nowPlaying();
                const requestedBy = currentTrack.requestedBy;
                if (requestedBy.id !== member.id)
                    return interaction.reply({
                        content: `You didn't request this track, ask ${requestedBy} to skip the track, because they requested it`,
                        ephemeral: true
                    });

                const position = options.getNumber("to");
                if (!position) {
                    queue.skip();
                    return interaction.reply({
                        content: "Current track skipped"
                    });
                }
                const skipTo = position - 1;
                const track = queue.tracks[skipTo];
                queue.skipTo(skipTo);
                return interaction.reply({
                    content: `Skipped to: **${track.title} - ${track.author}**`,
                    ephemeral: true
                });
            }
            case "seek": {
                if (!queue)
                    return interaction.reply({
                        content: "Music is not playing",
                        ephemeral: true
                    });

                const duration = options.getString("duration", true);
                const durationPattern = /^[0-5]?[0-9](:[0-5][0-9]){1,2}$/;
                if (!durationPattern.test(duration))
                    return interaction.reply({
                        content: "Duration provided in incorrect format"
                    });

                const durationMs = util.durationMs(duration);
                if (durationMs > queue.current.durationMS)
                    return interaction.reply({
                        content: "Duration you provided exceeds track duration",
                        ephemeral: true
                    });

                await queue.seek(durationMs);
                return interaction.reply({
                    content: `Seeked to ${duration}`,
                    ephemeral: true
                });
            }
        }
    }

    async contextMenuRun(interaction: ContextMenuCommandInteraction<"cached">) {
        const {
            systems: { music },
            util
        } = this.container;

        const { targetId, guild, channel, member } = interaction;

        if (!channel) return;

        const message = await channel.messages.fetch(targetId);
        const voiceChannel = member.voice.channel;

        const track = message.content;
        if (track.length < 1)
            return interaction.reply({
                content: "Track not provided",
                ephemeral: true
            });

        if (!voiceChannel)
            return interaction.reply({
                content: "You must be in a voice channel to queue a track",
                ephemeral: true
            });

        if (
            guild.members.me?.voice.channelId &&
            voiceChannel.id !== guild.members.me.voice.channelId
        )
            return interaction.reply({
                content: `You have to be in ${guild.members.me.voice.channel} to queue a track`,
                ephemeral: true
            });

        if (member.voice.deaf)
            return interaction.reply({
                content: "You cannot queue a track when deafened",
                ephemeral: true
            });

        let queue = music.getQueue(guild);

        if (!queue) {
            queue = music.createQueue(guild, {
                metadata: channel
            });

            try {
                if (!queue.connection) await queue.connect(voiceChannel);
            } catch {
                queue.destroy();
                return await interaction.reply({
                    content: "Could not join your voice channel",
                    ephemeral: true
                });
            }
        }

        await interaction.deferReply({ ephemeral: true });

        const result = await music.search(message.content, {
            requestedBy: interaction.user
        });

        if (result.tracks.length < 1)
            return await interaction.editReply({
                content: `Could not find any tracks: \`${track}\``
            });

        if (result.playlist) {
            const playlist = result.playlist;
            queue.addTracks(playlist.tracks);
            const embed = util
                .embed()
                .setAuthor({
                    name: playlist.author.name,
                    url: playlist.author.url
                })
                .setTitle(
                    `Queued a playlist - ${util.capFirstLetter(
                        playlist.source
                    )}`
                )
                .setThumbnail(playlist.thumbnail)
                .setDescription(
                    `Title: ${playlist.title}${
                        playlist.description
                            ? `Description: ${playlist.description}`
                            : ""
                    }`
                )
                .setURL(playlist.url);

            await interaction.editReply({ embeds: [embed] });
        } else {
            const tracksChosen = await music.selectTrack(
                interaction,
                result.tracks
            );

            queue.addTracks(tracksChosen);

            const embed = util.embed().setTitle("Queued Tracks")
                .setDescription(`
                        ${tracksChosen
                            .map(
                                (track, index) =>
                                    `\`${index + 1}\`. ${track.title} - ${
                                        track.author
                                    } | ${track.duration}`
                            )
                            .join(",\n")}
                        `);

            await interaction.editReply({ embeds: [embed], components: [] });
        }

        if (!queue.playing) await queue.play();

        return;
    }
}
