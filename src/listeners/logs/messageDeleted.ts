import { Listener } from "@sapphire/framework";
import { Message } from "discord.js";

export class MessageDeletedLogListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Logs when a message is deleted",
            event: "messageDelete"
        });
    }

    public async run(message: Message<true>) {
        if (message.author.bot) return;

        const { database, util } = this.container;

        const { guild } = message;

        const db = await database.guilds.get(guild);
        if (!db || !db.logs.channel || !db.logs.types.messageDeleted) return;

        const channel = guild.channels.cache.get(db.logs.channel);
        if (!channel || !channel.isText()) return;

        const attachments = message.attachments.map((attachment) => attachment);

        if (guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

        const embed = util
            .embed()
            .setAuthor({
                name: `${guild.name} Message Logs`,
                iconURL: guild.iconURL() as string
            })
            .setThumbnail(message.author.avatarURL({ dynamic: true }) as string)
            .setDescription(
                `*Message Deleted*${
                    message.content.length > 0
                        ? `\n\`\`\`${message.content}\`\`\``
                        : ""
                }`
            )
            .setFooter({ text: `ID: ${message.id}` });

        return channel.send({
            embeds: [embed],
            files: attachments
        });
    }
}
