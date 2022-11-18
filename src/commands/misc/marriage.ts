import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";

export class MarryCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "marriage",
            description: "Marriage System"
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .addSubcommand((command) =>
                    command
                        .setName("marry")
                        .setDescription("Marry your loved one :>")
                )
                .addSubcommand((command) =>
                    command
                        .setName("engage")
                        .setDescription(
                            "Engage with your loved one :> (You need to buy an engagement ring)"
                        )
                        .addUserOption((option) =>
                            option
                                .setName("person")
                                .setDescription(
                                    "Who do you want to engage with?"
                                )
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("divorce")
                        .setDescription("Divorce your loved one? :<")
                )
                .addSubcommand((command) =>
                    command
                        .setName("status")
                        .setDescription("Status of your marriage")
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { options, user } = interaction;

        switch (options.getSubcommand()) {
            case "engage": {
                const to = options.getUser("person", true);
            }
        }
    }
}
