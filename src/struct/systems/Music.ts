import { Container } from "@sapphire/pieces";
import { Player, Track, Util } from "discord-player";
import songlyrics from "songlyrics";
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    ContextMenuCommandInteraction,
    Message,
    User,
} from "discord.js";

export default class Music extends Player {
    readonly container: Container;
    readonly util: typeof Util;

    constructor(container: Container) {
        super(container.client, {
            ytdlOptions: {
                filter: "audioonly",
            },
        });

        this.container = container;
        this.util = Util;
    }

    async searchLyrics(title: string) {
        try {
            return await songlyrics(title);
        } catch (err) {
            console.error(err);
        }
    }

    async selectTrack(
        interaction:
            | ChatInputCommandInteraction<"cached">
            | ContextMenuCommandInteraction<"cached">,
        tracks: Track[]
    ) {
        const { util } = this.container;

        const options = tracks
            .filter((_, i) => i <= 25)
            .map((track, i) => ({
                label: util.shorten(`${track.title} - ${track.author}`, 99),
                value: `${i}`,
            }));

        const row = util
            .row()
            .setComponents(
                util
                    .dropdown()
                    .setCustomId("queue_track_select")
                    .setPlaceholder("Which track to queue?")
                    .setOptions(options)
                    .setMaxValues(options.length)
            );

        if (!interaction.deferred)
            await interaction.deferReply({ ephemeral: true });

        const message = await interaction.editReply({
            components: [row],
        });

        const awaitTracks = await message.awaitMessageComponent({
            componentType: ComponentType.SelectMenu,
            filter: (i) => i.customId === "queue_track_select",
        });

        const chosenTracks = [];

        for (let i = 0; i < tracks.length; i++) {
            if (awaitTracks.values.includes(`${i}`))
                chosenTracks.push(tracks[i]);
        }

        await awaitTracks.deferUpdate();
        return chosenTracks;
    }

    async selectTrackDM(user: User, tracks: Track[]) {
        const { util } = this.container;

        const options = tracks
            .filter((_, i) => i <= 25)
            .map((track, i) => ({
                label: util.shorten(`${track.title} - ${track.author}`, 99),
                value: `${i}`,
            }));

        const row = util
            .row()
            .setComponents(
                util
                    .dropdown()
                    .setCustomId("queue_track_select")
                    .setPlaceholder("Which track to queue?")
                    .setOptions(options)
                    .setMaxValues(options.length)
            );

        const message = await user.send({
            components: [row],
        });

        const awaitTracks = await message.awaitMessageComponent({
            componentType: ComponentType.SelectMenu,
            filter: (i) => i.customId === "queue_track_select",
        });

        const chosenTracks = [];

        for (let i = 0; i < tracks.length; i++) {
            if (awaitTracks.values.includes(`${i}`))
                chosenTracks.push(tracks[i]);
        }

        await awaitTracks.deferUpdate();
        return { message, chosenTracks };
    }

    async startButtons(message: Message) {
        const { util } = this.container;

        const topRow = util
            .row()
            .addComponents([
                util
                    .button()
                    .setCustomId("add_tracks")
                    .setLabel("Add Track(s)")
                    .setStyle(ButtonStyle.Primary),
                util
                    .button()
                    .setCustomId("show_queue")
                    .setLabel("Current Queue")
                    .setStyle(ButtonStyle.Primary),
                util
                    .button()
                    .setCustomId("show_track_progress")
                    .setLabel("Track Progress")
                    .setStyle(ButtonStyle.Primary),
            ]);

        const midRow = util
            .row()
            .addComponents([
                util
                    .button()
                    .setCustomId("pause_track")
                    .setLabel("Pause")
                    .setStyle(ButtonStyle.Danger),
                util
                    .button()
                    .setCustomId("skip_current_track")
                    .setLabel("Skip Current")
                    .setStyle(ButtonStyle.Danger),
                util
                    .button()
                    .setCustomId("skip_to_track")
                    .setLabel("Skip to")
                    .setStyle(ButtonStyle.Danger),
            ]);

        await message.edit({ components: [topRow, midRow] });
    }
}
