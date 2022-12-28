import { Listener } from "@sapphire/framework";
import { ButtonInteraction, ButtonStyle, TextInputStyle } from "discord.js";

export class MusicButtonsListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Music Buttons",
            event: "interactionCreate",
        });
    }

    async run(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        if (
            ![
                "show_queue",
                "show_track_progress",
                "pause_track",
                "resume_track",
                "skip_current_track",
                "skip_to_track",
                "cancel_track_select",
                "add_tracks",
            ].includes(interaction.customId)
        )
            return;

        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This button can only be used in a server",
                ephemeral: true,
            });

        const {
            systems: { music },
            util,
        } = this.container;

        const { guild, message, member } = interaction;

        const voiceChannel = member.voice.channel;

        const queue = music.getQueue(guild);
        if (!queue)
            return await interaction.reply({
                content: "Music is not playing",
                ephemeral: true,
            });

        if (!voiceChannel)
            return interaction.reply({
                content:
                    "You must be in a voice channel to be able to use the music buttons",
                ephemeral: true,
            });

        if (queue.connection.channel.id !== voiceChannel.id)
            return interaction.reply({
                content: `I'm already playing music in ${guild.members.me?.voice.channel}`,
                ephemeral: true,
            });

        switch (interaction.customId) {
            case "show_queue": {
                const current = queue.current;
                const mapped = queue.tracks.map((track, index) => {
                    return `\`${index + 1}\`. ${track.title} - ${
                        track.author
                    } | ${track.duration}`;
                });

                mapped.unshift(
                    `\`0\`. ${current.title} - ${current.author} | ${current.duration}`
                );

                const chunked = util.chunk(mapped, 10);

                if (chunked.length < 1)
                    return await interaction.reply({
                        content: "There are no tracks playing",
                        ephemeral: true,
                    });

                await util.pagination.default(
                    interaction,
                    chunked,
                    "Current Queue"
                );
                break;
            }
            case "show_track_progress": {
                const rows = message.components;
                const embed = message.embeds[0];

                embed.fields[2] = {
                    name: "Track Progress",
                    value: queue.createProgressBar(),
                    inline: false,
                };

                await message.edit({
                    embeds: [embed],
                    components: rows,
                });

                setTimeout(() => message.edit({ components: rows }), 3000);

                return interaction.deferUpdate();
            }
            case "pause_track": {
                const currentTrack = queue.nowPlaying();
                const requestedBy = currentTrack.requestedBy;

                if (requestedBy.id !== member.id)
                    return interaction.reply({
                        content: `You didn't request this track, ask ${requestedBy} to pause the track, because they requested it`,
                        ephemeral: true,
                    });

                const rows = message.components;

                rows[1].components[0] = util
                    .button()
                    .setCustomId("resume_track")
                    .setLabel("Resume")
                    .setStyle(ButtonStyle.Success) as any;

                await message.edit({ components: rows as any });
                queue.setPaused(true);

                return interaction.deferUpdate();
            }
            case "resume_track": {
                const currentTrack = queue.nowPlaying();
                const requestedBy = currentTrack.requestedBy;

                if (requestedBy.id !== member.id)
                    return interaction.reply({
                        content: `You didn't request this track, ask ${requestedBy} to resume the track, because they requested it`,
                        ephemeral: true,
                    });

                const rows = message.components;
                rows[1].components[0] = util
                    .button()
                    .setCustomId("pause_track")
                    .setLabel("Pause")
                    .setStyle(ButtonStyle.Danger) as any;

                await message.edit({ components: rows });
                queue.setPaused(false);

                return interaction.deferUpdate();
            }
            case "skip_current_track": {
                const currentTrack = queue.nowPlaying();
                const requestedBy = currentTrack.requestedBy;

                if (requestedBy.id !== member.id)
                    return interaction.reply({
                        content: `You didn't request this track, ask ${requestedBy} to skip the track, because they requested it`,
                        ephemeral: true,
                    });

                await message.edit({
                    content: `Skipped \`${currentTrack.author}\` - \`${currentTrack.title}\``,
                    embeds: [],
                    components: [],
                });

                queue.skip();

                setTimeout(() => message.delete().catch(console.error), 5000);
                return interaction.deferUpdate();
            }
            case "skip_to_track": {
                const rows = message.components;
                if (queue.tracks.length < 1)
                    return interaction.reply({
                        content: "There are no upcoming tracks",
                        ephemeral: true,
                    });

                const tracks = queue.tracks;
                const mapped = tracks
                    .filter((_, i) => i < 25)
                    .map((track) => {
                        return {
                            label: `${util.shorten(
                                `${track.title} - ${track.author}`,
                                99
                            )}`,
                            value: `${queue.getTrackPosition(track)}`,
                        };
                    });

                const cancelButton = util
                    .button()
                    .setCustomId("cancel_track_select")
                    .setLabel("Cancel Selection")
                    .setStyle(ButtonStyle.Secondary) as any;

                const dropdown = [
                    util
                        .stringMenu()
                        .setCustomId("select_track")
                        .setPlaceholder("Select a track")
                        .setMinValues(1)
                        .setMaxValues(1)
                        .setOptions(mapped),
                ];

                rows[1].components[2] = cancelButton;

                rows.push(util.row().addComponents(dropdown) as any);

                await message.edit({ components: rows });

                return interaction.deferUpdate();
            }
            case "cancel_track_select": {
                const rows = [message.components[0], message.components[1]];

                await interaction.deferUpdate();
                rows[1].components[2] = util
                    .button()
                    .setCustomId("skip_to_track")
                    .setLabel("Skip to Track")
                    .setStyle(ButtonStyle.Danger) as any;

                return message.edit({ components: rows });
            }
            case "add_tracks": {
                const modal = util
                    .modal()
                    .setCustomId("add_tracks_modal")
                    .setTitle("Adding Track(s) to the queue")
                    .addComponents(
                        util
                            .modalRow()
                            .addComponents(
                                util
                                    .input()
                                    .setCustomId("track_query")
                                    .setLabel("Track/Playlist URL or a name")
                                    .setStyle(TextInputStyle.Short)
                                    .setMinLength(1)
                                    .setMaxLength(100)
                                    .setRequired(true)
                            )
                    );

                await interaction.showModal(modal);
                break;
            }
        }
    }
}
