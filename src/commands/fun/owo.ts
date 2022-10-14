import { Command, Args } from "@sapphire/framework";
import { Message } from "discord.js";

export class OwOCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "owo",
            description: "OwOify some text"
        });
    }

    /**
     * Register Slash Command and Context Menu
     */
    public override registerApplicationCommands(registry: Command.Registry) {
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
            builder.setName("OwOify").setType(3)
        );
    }

    /**
     * Execute Message Command
     */
    public async messageRun(message: Message, args: Args) {
        const text = await args.rest("string").catch(() => null);

        if (!text) return message.reply("Provide some text");

        const { owo } = await this.container.util.nekos.OwOify({ text });

        return message.reply(owo);
    }

    /**
     * Execute Slash Command
     */
    public async chatInputRun(
        interaction: Command.ChatInputInteraction<"cached">
    ) {
        const text = interaction.options.getString("text", true);

        const { owo } = await this.container.util.nekos.OwOify({
            text
        });

        return interaction.reply(owo);
    }

    /**
     * Execute Context Menu
     */
    public async contextMenuRun(
        interaction: Command.ContextMenuInteraction<"cached">
    ) {
        const { channel, targetId } = interaction;

        if (!channel) return;
        const message = await channel.messages.fetch(targetId);

        if (message.content.length < 1)
            return interaction.reply({
                content: "Could not find text in the message",
                ephemeral: true
            });

        const { owo } = await this.container.util.nekos.OwOify({
            text: message.content
        });

        return interaction.reply(owo);
    }
}