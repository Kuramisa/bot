import { Queue, Track } from "@mateie/discord-player";
import { container, Listener } from "@sapphire/framework";
import { TextChannel } from "discord.js";

export class PlayerTrackAddListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Emits when track is added",
            event: "trackAdd",
            emitter: container.systems.music,
        });
    }

    async run(queue: Queue, track: Track) {
        if (queue.previousTracks.length < 1) return;

        const { util } = container;

        const embed = util
            .embed()
            .setAuthor({ name: track.author })
            .setTitle(track.title)
            .setURL(track.url)
            .setDescription("**Added to the queue**")
            .addFields([
                {
                    name: "Duration",
                    value: track.duration,
                    inline: true,
                },
                {
                    name: "Source",
                    value: track.source,
                    inline: true,
                },
            ])
            .setThumbnail(track.thumbnail)
            .setFooter({
                text: `Requested by ${track.requestedBy.tag}`,
            });

        const channel = queue.metadata as TextChannel;

        channel
            .send({ embeds: [embed] })
            .then((msg) => setTimeout(() => msg.delete(), 5000));
    }
}
