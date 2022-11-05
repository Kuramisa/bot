import { Listener } from "@sapphire/framework";
import { Message } from "discord.js";

export class MessageEditedLogListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Logs when a message is edited",
            event: "messageUpdate"
        });
    }

    public async run(oldMessage: Message, newMessage: Message) {
        if (!newMessage.inGuild()) return;
        if (!oldMessage.author || !newMessage.author) return;
        if (newMessage.author.bot) return;
        if (oldMessage.content === newMessage.content) return;

        const { database, util } = this.container;

        const { guild } = newMessage;

        const db = await database.guilds.get(guild);
        if (!db || !db.logs.channel || !db.logs.types.messageEdited) return;

        const channel = guild.channels.cache.get(db.logs.channel);
        if (!channel || !channel.isText()) return;

        if (guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

        const embed = util
            .embed()
            .setAuthor({
                name: `${guild.name} Message Logs`,
                iconURL: guild.iconURL() as string
            })
            .setThumbnail(
                newMessage.author.avatarURL({ dynamic: true }) as string
            )
            .setDescription(
                `
                *Message Edited*

                ***From***
                ${oldMessage.content ? `\`\`\`${oldMessage.content}\`\`\`` : ""}
                ***To***
                ${newMessage.content ? `\`\`\`${newMessage.content}\`\`\`` : ""}
            `
            )
            .setFooter({ text: `ID: ${newMessage.id}` });

        return channel.send({ embeds: [embed] });
    }
}
