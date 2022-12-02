import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";

export class MyIDCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "id",
            description: "Get certain Discord IDs",
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((command) =>
                    command.setName("my").setDescription("Grab your Discord ID")
                )
                .addSubcommand((command) =>
                    command
                        .setName("server")
                        .setDescription("Grab your Server ID")
                )
        );
    }

    chatInputRun = (interaction: ChatInputCommandInteraction) => {
        const { options, guild, user } = interaction;

        switch (options.getSubcommand()) {
            case "my": {
                return interaction.reply({
                    content: `Your Discord ID: **${user.id}**`,
                    ephemeral: true,
                });
            }
            case "server": {
                if (!interaction.inGuild() || !guild)
                    return interaction.reply({
                        content: "Please use this command in a server",
                        ephemeral: true,
                    });

                if (guild.ownerId !== user.id)
                    return interaction.reply({
                        content: "Only the server owner can use this command",
                        ephemeral: true,
                    });

                return interaction.reply({
                    content: `${guild.name} Server ID: **${guild.id}**`,
                    ephemeral: true,
                });
            }
        }
    };
}
