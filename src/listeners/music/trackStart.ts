import { Queue, Track } from "@mateie/discord-player";
import { container, Listener } from "@sapphire/framework";
import { TextChannel } from "discord.js";

export class PlayerTrackStartListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Emits when a new track starts",
            event: "trackStart",
            emitter: container.systems.music,
        });
    }

    async run(queue: Queue, track: Track) {
        const {
            systems: { music },
            util,
        } = container;

        const embed = util
            .embed()
            .setAuthor({ name: track.author })
            .setTitle(track.title)
            .setURL(track.url)
            .setDescription("**Started Playing**")
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
            .setThumbnail(
                (typeof track.thumbnail === "object"
                    ? null
                    : track.thumbnail) as string
            )
            .setFooter({
                text: `Requested by ${track.requestedBy.tag}`,
            });

        const channel = queue.metadata as TextChannel;

        const message = await channel.send({ embeds: [embed] });

        await music.startButtons(message);
    }
}
