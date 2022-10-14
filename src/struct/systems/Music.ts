import { Container } from "@sapphire/pieces";
import { Player, Track, Util } from "@mateie/discord-player";
import songlyrics from "songlyrics";
import { ContextMenuInteraction, User } from "discord.js";
import { Message, CommandInteraction } from "discord.js";

export default class Music extends Player {
    readonly container: Container;
    readonly util: typeof Util;

    constructor(container: Container) {
        super(container.client);

        this.container = container;
        this.util = Util;
    }

    async searchLyrics(title: string) {
        try {
            const search = await songlyrics(title);
            return search;
        } catch (err) {
            console.error(err);
        }
    }

    async selectTrack(
        interaction:
            | CommandInteraction<"cached">
            | ContextMenuInteraction<"cached">,
        tracks: Track[]
    ) {
        const options = tracks
            .filter((_, i) => i <= 25)
            .map((track, i) => ({
                label: this.container.util.shorten(
                    `${track.title} - ${track.author}`,
                    99
                ),
                value: `${i}`
            }));

        const row = this.container.util
            .row()
            .setComponents(
                this.container.util
                    .dropdown()
                    .setCustomId("queue_track_select")
                    .setPlaceholder("Which track to queue?")
                    .setOptions(options)
                    .setMaxValues(options.length)
            );

        if (!interaction.deferred)
            await interaction.deferReply({ ephemeral: true });

        const message = await interaction.editReply({
            components: [row]
        });

        const awaitTracks = await message.awaitMessageComponent({
            componentType: "SELECT_MENU",
            filter: (i) => i.customId === "queue_track_select"
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
        const options = tracks
            .filter((_, i) => i <= 25)
            .map((track, i) => ({
                label: this.container.util.shorten(
                    `${track.title} - ${track.author}`,
                    99
                ),
                value: `${i}`
            }));

        const row = this.container.util
            .row()
            .setComponents(
                this.container.util
                    .dropdown()
                    .setCustomId("queue_track_select")
                    .setPlaceholder("Which track to queue?")
                    .setOptions(options)
                    .setMaxValues(options.length)
            );

        const message = await user.send({
            components: [row]
        });

        const awaitTracks = await message.awaitMessageComponent({
            componentType: "SELECT_MENU",
            filter: (i) => i.customId === "queue_track_select"
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
        const topRow = this.container.util
            .row()
            .addComponents([
                this.container.util
                    .button()
                    .setCustomId("add_tracks")
                    .setLabel("Add Track(s)")
                    .setStyle("PRIMARY"),
                this.container.util
                    .button()
                    .setCustomId("show_queue")
                    .setLabel("Current Queue")
                    .setStyle("PRIMARY"),
                this.container.util
                    .button()
                    .setCustomId("show_track_progress")
                    .setLabel("Track Progress")
                    .setStyle("PRIMARY")
            ]);

        const midRow = this.container.util
            .row()
            .addComponents([
                this.container.util
                    .button()
                    .setCustomId("pause_track")
                    .setLabel("Pause")
                    .setStyle("DANGER"),
                this.container.util
                    .button()
                    .setCustomId("skip_current_track")
                    .setLabel("Skip Current")
                    .setStyle("DANGER"),
                this.container.util
                    .button()
                    .setCustomId("skip_to_track")
                    .setLabel("Skip to")
                    .setStyle("DANGER")
            ]);

        await message.edit({ components: [topRow, midRow] });
    }
}
