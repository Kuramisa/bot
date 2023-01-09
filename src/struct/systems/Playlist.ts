import { Container } from "@sapphire/pieces";
import { Player, Track } from "@mateie/discord-player";
import {
    ChatInputCommandInteraction,
    TextInputModalData,
    TextInputStyle,
} from "discord.js";

export default class Playlist {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async play(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const {
            database,
            systems: { music },
            util,
        } = this.container;

        const { options, guild, channel, member } = interaction;

        const voiceChannel = member.voice.channel;

        if (!voiceChannel)
            return interaction.reply({
                content:
                    "You must be in a voice channel to be able to use the music commands",
                ephemeral: true,
            });

        if (
            guild.members.me?.voice.channelId &&
            voiceChannel.id !== guild.members.me.voice.channelId
        )
            return interaction.reply({
                content: `I'm already playing music in ${guild.members.me.voice.channel}`,
                ephemeral: true,
            });

        if (member.voice.deaf)
            return interaction.reply({
                content: "You cannot play music when deafened",
                ephemeral: true,
            });

        const name = options.getString("playlist_name", true);

        const playlist = await database.playlists.get(member.id, name);

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true,
            });

        if (playlist.tracks.length < 1)
            return interaction.reply({
                content: "No tracks found in your playlist",
                ephemeral: true,
            });

        let queue = music.getQueue(guild);

        if (!queue) {
            queue = music.createQueue(guild, {
                metadata: channel,
            });

            try {
                if (!queue.connection) await queue.connect(voiceChannel);
            } catch (err) {
                queue.destroy();
                return interaction.reply({
                    content: "Could not join your voice channel",
                    ephemeral: true,
                });
            }
        }

        const tracks = playlist.tracks.map(
            (track) => new Track(queue?.player as Player, track)
        );

        queue.addTracks(tracks);

        if (!queue.playing) await queue.play();

        const embed = util.embed().setTitle(`Playlist ${name}`).setDescription(`
                ${tracks
                    .map((track, index) => {
                        const duration = music.util.parseMS(
                            parseInt(track.duration)
                        );

                        const formatted = duration.hours
                            ? `${duration.hours}:${duration.minutes}:${duration.seconds}`
                            : `${duration.minutes}:${duration.seconds}`;

                        return `\`${index + 1}\`. ${track.title} - ${
                            track.author
                        } | ${formatted}`;
                    })
                    .join(",\n")}`);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async create(interaction: ChatInputCommandInteraction) {
        const { database } = this.container;

        const { options, user } = interaction;

        if ((await database.playlists.getAll(user.id)).length === 5)
            return interaction.reply({
                content: "You can only have 5 playlist",
                ephemeral: true,
            });

        const name = options.getString("playlist_name", true);

        if (
            (await database.playlists.getAll(user.id)).some(
                (playlist) => playlist.name === name
            )
        )
            return interaction.reply({
                content: `You already have a playlist named \`${name}\``,
                ephemeral: true,
            });

        await database.playlists.create({
            user,
            name,
        });

        return interaction.reply({
            content: `Created a playlist for you named \`${name}\``,
            ephemeral: true,
        });
    }

    async import(interaction: ChatInputCommandInteraction) {
        const {
            database,
            systems: { music },
            util,
        } = this.container;

        const { options, user } = interaction;

        const url = options.getString("playlist_url", true);

        const result = await music.search(url, {
            requestedBy: interaction.user,
        });

        if (!result.playlist)
            return interaction.reply({
                content: "URL provided is not a playlist",
            });

        const { playlist } = result;

        if (
            (await database.playlists.getAll(user.id)).some(
                (pl) => pl.name === playlist.title
            )
        )
            return interaction.reply({
                content: "You already have a playlist with the same name",
                ephemeral: true,
            });

        const newPlaylist = await database.playlists.create({
            user,
            name: playlist.title,
        });

        const tracks = playlist.tracks
            .map((track) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { playlist, ...customTrack } = track;

                return { ...customTrack, ...track.raw };
            })
            .map((track) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { playlist, ...customTrack } = track;

                return { ...customTrack, ...track.raw };
            });

        newPlaylist.tracks = tracks;

        await newPlaylist.save();

        const { title, author, source, type } = playlist;

        return interaction.reply({
            content: `Imported \`${title} by ${author.name} - ${
                tracks.length
            } Tracks - ${util.capFirstLetter(source)} ${util.capFirstLetter(
                type
            )}\``,
            ephemeral: true,
        });
    }

    async importMultiple(interaction: ChatInputCommandInteraction) {
        const {
            database,
            systems: { music },
            util,
        } = this.container;

        const { options } = interaction;

        const name = options.getString("playlist_name", true);
        const amount = options.getNumber("amount", true);

        const rows = [];

        for (let i = 1; i <= amount; i++) {
            const row = util
                .modalRow()
                .setComponents(
                    util
                        .input()
                        .setCustomId(`playlist_url_${i}`)
                        .setLabel(`Playlist #${i} URL`)
                        .setPlaceholder(`Playlist #${i} URL`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                );

            rows.push(row);
        }

        const modal = util
            .modal()
            .setCustomId("import_multiple_playlists")
            .setTitle(`Importing ${amount} Playlists as ${name}`)
            .setComponents(...rows);

        await interaction.showModal(modal);

        const mInteraction = await interaction.awaitModalSubmit({
            time: 0,
        });

        await mInteraction.deferReply({ ephemeral: true });

        const { components, user } = mInteraction;

        const newPlaylist = await database.playlists.create({
            user,
            name,
        });

        const playlists = [];

        for (let i = 0; i < components.length; i++) {
            const field = components[i];
            const f = field.components[0] as TextInputModalData;
            const result = await music.search(f.value, {
                requestedBy: interaction.user,
            });

            if (!result.playlist) continue;

            playlists.push(result.playlist.tracks);
        }

        if (playlists.length < 1 || playlists.length !== amount) {
            await mInteraction.reply({
                content:
                    "One or more URLs are not valid playlists (Make sure playlists are public)",
                ephemeral: true,
            });

            return;
        }

        newPlaylist.tracks = playlists
            .flat()
            .map((track) => {
                const truck = track as Track;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { playlist, ...customTrack } = truck;

                return { ...customTrack, ...truck.raw };
            })
            .map((track) => {
                const truck = track as Track;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { playlist, ...customTrack } = truck;

                return { ...customTrack, ...truck.raw };
            });

        await newPlaylist.save();

        await mInteraction.editReply({
            content: `Added ${amount} playlists to your new playlist \`${name}\``,
        });
    }

    async delete(interaction: ChatInputCommandInteraction) {
        const { database, util } = this.container;

        const { options, user } = interaction;

        const name = options.getString("playlist_name", true);

        const playlist = await database.playlists.get(user.id, name);

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true,
            });

        const confirmText = `${user.username}/${playlist.name}`;

        const modal = util
            .modal()
            .setCustomId("delete_playlist")
            .setTitle(`Deleting Playlist: ${name}`)
            .setComponents(
                util
                    .modalRow()
                    .setComponents(
                        util
                            .input()
                            .setCustomId("confirm_playlist_name")
                            .setLabel("Confirm Playlist Name")
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder(confirmText)
                            .setMaxLength(confirmText.length)
                    )
            );

        await interaction.showModal(modal);

        const mInteraction = await interaction.awaitModalSubmit({
            time: 0,
        });

        const entered = mInteraction.fields.getTextInputValue(
            "confirm_playlist_name"
        );

        if (entered !== confirmText) {
            await mInteraction.reply({
                content: "Playlist was not deleted, confirmation failed",
                ephemeral: true,
            });

            return;
        }

        await database.playlists.delete(user.id, name);

        await mInteraction.reply({
            content: "Playlist was deleted successfully",
            ephemeral: true,
        });
    }

    async add(interaction: ChatInputCommandInteraction) {
        const {
            database,
            systems: { music },
        } = this.container;

        const { options, user } = interaction;

        const playlistName = options.getString("playlist_name", true);
        const query = options.getString("query", true);

        if (query.length < 1)
            return interaction.reply({ content: "No Tracks Provided" });

        const playlist = await database.playlists.get(user.id, playlistName);

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true,
            });

        const results = await music.search(query, {
            requestedBy: interaction.user,
        });

        if (results.tracks.length < 1)
            return interaction.reply({
                content: `Tracks with \`${query}\` was not found`,
                ephemeral: true,
            });

        if (results.playlist) {
            const tracks = results.playlist.tracks.map((track) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { playlist, ...customTrack } = track;

                return { ...customTrack, ...track.raw };
            });

            playlist.tracks = [...tracks, ...playlist.tracks];
        } else {
            const track = results.tracks[0];
            playlist.tracks.push({ ...track.raw, ...track });
        }

        await playlist.save();

        return interaction.reply({
            content: `Added \`${
                results.playlist ? results.playlist.title : query
            }\` to your playlist \`${playlistName}\``,
            ephemeral: true,
        });
    }

    async addMultiple(interaction: ChatInputCommandInteraction) {
        const {
            database,
            systems: { music },
            util,
        } = this.container;

        const { options, user } = interaction;

        const name = options.getString("playlist_name", true);
        const query = options.getString("query", true);

        const playlist = await database.playlists.get(user.id, name);

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true,
            });

        const result = await music.search(query, {
            requestedBy: interaction.user,
        });

        if (result.tracks.length < 1)
            return interaction.reply({
                content: `Tracks with \`${query}\` was not found`,
                ephemeral: true,
            });

        const tracksChosen = (
            await music.selectTrack(interaction, result.tracks)
        ).map((track) => ({ ...track, ...track.raw }));

        playlist.tracks = [...playlist.tracks, ...tracksChosen];

        await playlist.save();

        const embed = util.embed().setTitle("Added Tracks to the playlist")
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

        return interaction.editReply({ embeds: [embed], components: [] });
    }

    async list(interaction: ChatInputCommandInteraction) {
        const { database, util } = this.container;

        const { user } = interaction;

        const playlists = await database.playlists.getAll(user.id);

        if (playlists.length < 1)
            return interaction.reply({
                content: "You have no playlists",
                ephemeral: true,
            });

        const embed = util
            .embed()
            .setTitle("Your Playlists")
            .setDescription(
                playlists
                    .map(
                        (playlist, index) =>
                            `\`${index + 1}\`. ${playlist.name} - ${
                                playlist.tracks.length
                            } tracks`
                    )
                    .join(",\n")
            );

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async rename(interaction: ChatInputCommandInteraction) {
        const { database } = this.container;

        const { options, user } = interaction;

        const oldName = options.getString("playlist_name", true);
        const newName = options.getString("new_name", true);

        const playlist = await database.playlists.get(user.id, oldName);

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true,
            });

        playlist.name = newName;

        await playlist.save();

        return interaction.reply({
            content: `Playlist \`${oldName}\` was renamed to \`${newName}\``,
            ephemeral: true,
        });
    }

    async info(interaction: ChatInputCommandInteraction) {
        const { database, util } = this.container;

        const { options, user } = interaction;

        const name = options.getString("playlist_name", true);

        const playlist = await database.playlists.get(user.id, name);

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true,
            });

        const tracks = util.chunk(
            playlist.tracks.map(
                (track, index) =>
                    `\`${index + 1}\`. ${track.title} - ${track.author} | ${
                        track.duration
                    }`
            ),
            25
        );

        return util.pagination.default(
            interaction,
            tracks,
            `Playlist: ${name} - ${playlist.tracks.length} tracks`,
            true
        );
    }
}
