/* eslint-disable @typescript-eslint/no-unused-vars */
import { Container } from "@sapphire/pieces";
import { Player, Track } from "@mateie/discord-player";
import { CommandInteraction } from "discord.js";

export default class Playlists {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async play(interaction: CommandInteraction<"cached">) {
        const { options, guild, channel, member } = interaction;

        const voiceChannel = member.voice.channel;

        if (!voiceChannel)
            return interaction.reply({
                content:
                    "You must be in a voice channel to be able to use the music commands",
                ephemeral: true
            });

        if (
            guild.me?.voice.channelId &&
            voiceChannel.id !== guild.me.voice.channelId
        )
            return interaction.reply({
                content: `I'm already playing music in ${guild.me.voice.channel}`,
                ephemeral: true
            });

        if (member.voice.deaf)
            return interaction.reply({
                content: "You cannot play music when deafened",
                ephemeral: true
            });

        const name = options.getString("playlist_name", true);

        const playlist = await this.container.database.playlists.get(
            member.id,
            name
        );

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true
            });

        if (playlist.tracks.length < 1)
            return interaction.reply({
                content: "No tracks found in your playlist",
                ephemeral: true
            });

        let queue = this.container.music.getQueue(guild);

        if (!queue) {
            queue = this.container.music.createQueue(guild, {
                metadata: channel
            });

            try {
                if (!queue.connection) await queue.connect(voiceChannel);
            } catch (err) {
                queue.destroy();
                return interaction.reply({
                    content: "Could not join your voice channel",
                    ephemeral: true
                });
            }
        }

        const tracks = playlist.tracks.map(
            (track) => new Track(queue?.player as Player, track)
        );

        queue.addTracks(tracks);

        if (!queue.playing) await queue.play();

        const embed = this.container.util.embed().setTitle(`Playlist ${name}`)
            .setDescription(`
                ${tracks
                    .map((track, index) => {
                        const duration = this.container.music.util.parseMS(
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

    async create(interaction: CommandInteraction<"cached">) {
        const { options, member } = interaction;

        if (
            (await this.container.database.playlists.getAll(member.id))
                .length === 5
        )
            return interaction.reply({
                content: "You can only have 5 playlist",
                ephemeral: true
            });

        const name = options.getString("playlist_name", true);

        if (
            (await this.container.database.playlists.getAll(member.id)).some(
                (playlist) => playlist.name === name
            )
        )
            return interaction.reply({
                content: `You already have a playlist named \`${name}\``,
                ephemeral: true
            });

        await this.container.database.playlists.create({
            member,
            name
        });

        return interaction.reply({
            content: `Created a playlist for you named \`${name}\``,
            ephemeral: true
        });
    }

    async import(interaction: CommandInteraction<"cached">) {
        const { options, member } = interaction;

        const url = options.getString("playlist_url", true);

        const result = await this.container.music.search(url, {
            requestedBy: interaction.user
        });

        if (!result.playlist)
            return interaction.reply({
                content: "URL provided is not a playlist"
            });

        const { playlist } = result;

        if (
            (await this.container.database.playlists.getAll(member.id)).some(
                (pl) => pl.name === playlist.title
            )
        )
            return interaction.reply({
                content: "You already have a playlist with the same name",
                ephemeral: true
            });

        const newPlaylist = await this.container.database.playlists.create({
            member,
            name: playlist.title
        });

        const tracks = playlist.tracks.map((track) => {
            const { playlist, ...trck } = track;

            return { ...trck, ...track.raw };
        });

        newPlaylist.tracks = [...tracks, ...newPlaylist.tracks];

        await newPlaylist.save();

        const { title, author, source, type } = playlist;

        return interaction.reply({
            content: `Imported \`${title} by ${author.name} - ${
                tracks.length
            } Tracks - ${this.container.util.capFirstLetter(
                source
            )} ${this.container.util.capFirstLetter(type)}\``,
            ephemeral: true
        });
    }

    async importMultiple(interaction: CommandInteraction<"cached">) {
        const { options } = interaction;

        const name = options.getString("playlist_name", true);
        const amount = options.getNumber("amount", true);

        const rows = [];

        for (let i = 1; i <= amount; i++) {
            const row = this.container.util
                .modalRow()
                .setComponents(
                    this.container.util
                        .input()
                        .setCustomId(`playlist_url_${i}`)
                        .setLabel(`Playlist #${i} URL`)
                        .setPlaceholder(`Playlist #${i} URL`)
                        .setStyle("SHORT")
                        .setRequired(true)
                );

            rows.push(row);
        }

        const modal = this.container.util
            .modal()
            .setCustomId("import_multiple_playlists")
            .setTitle(`Importing ${amount} Playlists as ${name}`)
            .setComponents(...rows);

        await interaction.showModal(modal);

        const mInteraction = await interaction.awaitModalSubmit({
            time: 0
        });

        const { components } = mInteraction;

        const member = mInteraction.member;

        const newPlaylist = await this.container.database.playlists.create({
            member,
            name
        });

        const playlists = (
            await Promise.all(
                components.map(async (field) => {
                    const result = await this.container.music.search(
                        field.components[0].value,
                        {
                            requestedBy: interaction.user
                        }
                    );

                    if (!result.playlist) return null;

                    return result.playlist.tracks;
                })
            )
        ).filter((el) => el !== null);

        if (playlists.length < 1 || playlists.length !== amount) {
            await mInteraction.reply({
                content:
                    "One or more URLs are not valid playlists (Make sure playlists are public)",
                ephemeral: true
            });

            return;
        }

        const tracks = playlists.flat().map((track) => {
            const truck = track as Track;
            const { playlist, ...trck } = truck;

            return { ...trck, ...truck.raw };
        });

        newPlaylist.tracks = [...tracks, ...newPlaylist.tracks];

        await newPlaylist.save();

        await mInteraction.reply({
            content: `Added ${amount} playlists to your new playlist \`${name}\``,
            ephemeral: true
        });
    }

    async delete(interaction: CommandInteraction<"cached">) {
        const { options, member } = interaction;

        const name = options.getString("playlist_name", true);

        const playlist = await this.container.database.playlists.get(
            member.id,
            name
        );

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true
            });

        const confirmText = `${member.user.username}/${playlist.name}`;

        const modal = this.container.util
            .modal()
            .setCustomId("delete_playlist")
            .setTitle(`Deleting Playlist: ${name}`)
            .setComponents(
                this.container.util
                    .modalRow()
                    .setComponents(
                        this.container.util
                            .input()
                            .setCustomId("confirm_playlist_name")
                            .setLabel("Confirm Playlist Name")
                            .setStyle("SHORT")
                            .setPlaceholder(confirmText)
                            .setMaxLength(confirmText.length)
                    )
            );

        await interaction.showModal(modal);

        const mInteraction = await interaction.awaitModalSubmit({
            time: 0
        });

        const entered = mInteraction.fields.getTextInputValue(
            "confirm_playlist_name"
        );

        if (entered !== confirmText) {
            await mInteraction.reply({
                content: "Playlist was not deleted, confirmation failed",
                ephemeral: true
            });

            return;
        }

        await this.container.database.playlists.delete(member.id, name);

        await mInteraction.reply({
            content: "Playlist was deleted successfully",
            ephemeral: true
        });
    }

    async add(interaction: CommandInteraction<"cached">) {
        const { options, member } = interaction;

        const playlistName = options.getString("playlist_name", true);
        const query = options.getString("query", true);

        if (query.length < 1)
            return interaction.reply({ content: "No Tracks Provided" });

        const playlist = await this.container.database.playlists.get(
            member.id,
            playlistName
        );

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true
            });

        const results = await this.container.music.search(query, {
            requestedBy: interaction.user
        });

        if (results.tracks.length < 1)
            return interaction.reply({
                content: `Tracks with \`${query}\` was not found`,
                ephemeral: true
            });

        if (results.playlist) {
            const tracks = results.playlist.tracks.map((track) => {
                const { playlist, ...trck } = track;

                return { ...trck, ...track.raw };
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
            ephemeral: true
        });
    }

    async addMultiple(interaction: CommandInteraction<"cached">) {
        const { options, member } = interaction;

        const name = options.getString("playlist_name", true);
        const query = options.getString("query", true);

        const playlist = await this.container.database.playlists.get(
            member.id,
            name
        );

        if (!playlist)
            return interaction.reply({
                content: "Playlist not found",
                ephemeral: true
            });

        const result = await this.container.music.search(query, {
            requestedBy: interaction.user
        });

        if (result.tracks.length < 1)
            return interaction.reply({
                content: `Tracks with \`${query}\` was not found`,
                ephemeral: true
            });

        const tracksChosen = (
            await this.container.music.selectTrack(interaction, result.tracks)
        ).map((track) => ({ ...track, ...track.raw }));

        playlist.tracks = [...playlist.tracks, ...tracksChosen];

        await playlist.save();

        const embed = this.container.util
            .embed()
            .setTitle("Added Tracks to the playlist").setDescription(`
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
}
