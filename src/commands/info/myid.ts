import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";

export class MyIDCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "myid",
            description: "Get your Discord ID"
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
    }

    chatInputRun = (interaction: ChatInputCommandInteraction) =>
        interaction.reply({
            content: `Your Discord ID: ${interaction.user.id}`,
            ephemeral: true
        });
}
