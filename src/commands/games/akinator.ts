import { Args, Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, Message } from "discord.js";
import akinator from "discord.js-akinator";

export class AkinatorCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "akinator",
            description: "Akinator Game",
            aliases: ["ak"],
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption((option) =>
                    option
                        .setName("game_type")
                        .setDescription(
                            "What/Who is Akinator guessing (Defaults to character)"
                        )
                        .setChoices(
                            { name: "Animal", value: "animal" },
                            { name: "Character", value: "character" },
                            { name: "Object", value: "object" }
                        )
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const gameType = interaction.options.getString("game_type")
            ? interaction.options.getString("game_type")
            : "character";

        akinator(interaction, {
            gameType,
            useButtons: true,
        });
    }

    async messageRun(message: Message, args: Args) {
        const gameType = await args.pick("string").catch(() => "character");

        akinator(message, {
            gameType,
            useButtons: true,
        });
    }
}
