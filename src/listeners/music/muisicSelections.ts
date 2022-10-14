import { Listener } from "@sapphire/framework";
import { SelectMenuInteraction } from "discord.js";

export class MusicSelectionsDropListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Dropdown for the music selections",
            event: "interactionCreate"
        });
    }

    public async run(interaction: SelectMenuInteraction<"cached">) {
        if (!interaction.isSelectMenu()) return;

        if (interaction.customId !== "select_track") return;

        const { music, util } = this.container;

        const { guild, message, member } = interaction;

        const queue = music.getQueue(guild);
        const voiceChannel = member.voice.channel;

        if (!voiceChannel)
            return interaction.reply({
                content: "You must be in a voice channel to select a track",
                ephemeral: true
            });

        if (!queue)
            return interaction.reply({
                content: "Music is not playing",
                ephemeral: true
            });

        if (queue.connection.channel.id !== voiceChannel.id)
            return interaction.reply({
                content: `I'm already playing music in ${guild.me?.voice.channel}`,
                ephemeral: true
            });

        if (queue.tracks.length < 1)
            return interaction.reply({
                content: "Select menu is expired, please try one that is not",
                ephemeral: true
            });

        const value = parseInt(interaction.values[0]);
        const track = queue.tracks[value];
        const skipTo = queue.getTrackPosition(track);

        if (track.requestedBy.id !== member.id)
            return interaction.reply({
                content: `You didn't request this track, ask ${track.requestedBy} to skip the track, because they requested it`,
                ephemeral: true
            });

        queue.skipTo(skipTo);

        await interaction.reply({
            content: `Skipped to \`${track.author}\` - \`${track.title}\``
        });

        message.edit({ components: [] });
        setTimeout(() => message.delete(), 5000);
    }
}
