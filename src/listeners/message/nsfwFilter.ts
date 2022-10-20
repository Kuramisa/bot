import { Listener } from "@sapphire/framework";
import { Message } from "discord.js";

import Tenor from "tenor-api-wrapper";

const { TENOR_API } = process.env;

export class NSFWFilterListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Filter NSFW from messages",
            event: "messageCreate"
        });
    }

    public async run(message: Message<true>) {
        const types = ["jpg", "png", "bmp", "gif", "webp"];
        if (!types.some((type) => message.content.includes(type))) return;

        const { client, database, moderation } = this.container;

        const { channel, guild } = message;

        const db = await database.guilds.get(guild);
        if (!db) return;

        if (!db.toggles.nsfwFilter) return;

        let url = message.content;

        const tenor = new Tenor({
            apiKey: TENOR_API as string
        });

        if (url.includes("https://tenor.com/view")) {
            const split = url.split("-");
            const id = split[split.length - 1];

            url = (await tenor.fetch("id", parseInt(id)))[0].data.media.find(
                (media) => media.key === "gif"
            )?.url as string;
        }

        const filter = await moderation.image(url);
        if (filter.error_code === 1001) return;
        if (filter.rating_letter !== "a") return;

        message.delete().catch(console.error);

        if (
            channel.isThread() &&
            guild.me?.permissionsIn(channel).has("SEND_MESSAGES")
        )
            return channel.send("Do not post NSFW content");

        if (channel.isThread() || !guild.me?.permissions.has("MANAGE_WEBHOOKS"))
            return;

        const webhook = await channel.createWebhook(
            `${client.user?.username} NSFW Filter`,
            {
                avatar: client.user?.displayAvatarURL({ dynamic: true })
            }
        );

        const wMessage = await webhook.send(
            `${message.member}, Do not post NSFW Content`
        );

        setTimeout(() => {
            webhook.deleteMessage(wMessage);
            webhook.delete();
        }, 5000);
    }
}
