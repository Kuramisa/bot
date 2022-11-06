import { Command, Args } from "@sapphire/framework";
import { Message } from "discord.js";

export class EightBallCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "8ball",
            aliases: ["ask", "8b"],
            description: "8ball answers your burning questions"
        });
    }

    /**
     * Register Slash Command
     */
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption((option) =>
                    option
                        .setName("question")
                        .setDescription("Question for the 8 Ball")
                        .setRequired(true)
                )
        );
    }

    /**
     * Execute Message Command
     */
    public async messageRun(message: Message, args: Args) {
        let question = await args.rest("string").catch(() => null);

        const { util } = this.container;

        if (!question) return message.reply("Question not provided");

        if (!question.includes("?")) question += "?";

        const { url, response } = await util.nekos.eightBall({
            text: question
        });

        const embed = util.embed().setDescription(`\`${question}\``);
        if (url) embed.setImage(url);
        else embed.setDescription(`${embed.description}\n**${response}**`);

        return message.reply({ embeds: [embed] });
    }

    /**
     * Execute Slash Command
     */

    public async chatInputRun(interaction: Command.ChatInputInteraction) {
        let question = interaction.options.getString("question", true);

        const { util } = this.container;

        if (!question.includes("?")) question += "?";

        const { url, response } = await util.nekos.eightBall({
            text: question
        });

        const embed = util.embed().setDescription(`\`${question}\``);
        if (url) embed.setImage(url);
        else embed.setDescription(`${embed.description}\n**${response}**`);

        return interaction.reply({ embeds: [embed] });
    }
}
