import { Args, Command } from "@sapphire/framework";
import {
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    Message,
} from "discord.js";

export class OwOCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "owo",
            description: "OwOify some text",
        });
    }

    /**
     * Register Slash Command and Context Menu
     */
    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption((option) =>
                    option
                        .setName("text")
                        .setDescription("Text to OwOify")
                        .setRequired(true)
                )
        );

        registry.registerContextMenuCommand((builder) =>
            builder.setName("OwOify").setDMPermission(false).setType(3)
        );
    }

    /**
     * Execute Message Command
     */
    async messageRun(message: Message, args: Args) {
        const text = await args.rest("string").catch(() => null);

        if (!text) return message.reply("Provide some text");

        const { owo } = await this.container.util.nekos.OwOify({ text });

        return message.reply(owo);
    }

    /**
     * Execute Slash Command
     */
    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const text = interaction.options.getString("text", true);

        const { owo } = await this.container.util.nekos.OwOify({
            text,
        });

        return interaction.reply(owo);
    }

    /**
     * Execute Context Menu
     */
    async contextMenuRun(interaction: ContextMenuCommandInteraction) {
        const { channel, targetId } = interaction;

        if (!channel) return;
        const message = await channel.messages.fetch(targetId);

        if (message.content.length < 1)
            return interaction.reply({
                content: "Could not find text in the message",
                ephemeral: true,
            });

        const { owo } = await this.container.util.nekos.OwOify({
            text: message.content,
        });

        return interaction.reply(owo);
    }
}
