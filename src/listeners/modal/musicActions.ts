import { Listener } from "@sapphire/framework";
import { ModalSubmitInteraction } from "discord.js";

export class MusicActionsModalListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Handle modals from music buttons",
            event: "interactionCreate"
        });
    }

    async run(interaction: ModalSubmitInteraction<"cached">) {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId !== "add_tracks_modal") return;

        const {
            systems: { music }
        } = this.container;

        const { fields, guild, member } = interaction;

        const voiceChannel = member.voice.channel;

        const queue = music.getQueue(guild);
        if (!queue)
            return interaction.reply({
                content: "Music is not playing",
                ephemeral: true
            });

        if (!voiceChannel)
            return interaction.reply({
                content:
                    "You must be in a voice channel to be able to add tracks"
            });

        if (queue.connection.channel.id !== voiceChannel.id)
            return interaction.reply({
                content: `I'm playing music in ${guild.me?.voice.channel}`,
                ephemeral: true
            });

        const query = fields.getTextInputValue("track_query");
        const result = await music.search(query, {
            requestedBy: interaction.user
        });

        if (result.playlist) queue.addTracks(result.playlist.tracks);
        else queue.addTrack(result.tracks[0]);
        return interaction.deferUpdate();
    }
}
