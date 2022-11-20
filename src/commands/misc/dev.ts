import { Subcommand } from "@sapphire/plugin-subcommands";
import { ChatInputCommandInteraction, TextInputStyle } from "discord.js";

export class DevCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "dev",
            description: "Ways to contact developers",
            subcommands: [
                {
                    name: "report",
                    chatInputRun: "chatInputReport"
                },
                {
                    name: "suggest",
                    chatInputRun: "chatInputSuggest"
                }
            ]
        });
    }

    /**
     * Register Slash Command
     */
    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((command) =>
                    command
                        .setName("report")
                        .setDescription(
                            "Report bugs/issues with the bot to the Bot Developer"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("report")
                                .setDescription("What are you reporting?")
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("suggest")
                        .setDescription(
                            "Suggest features and other things to the Bot Developer"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("suggestion")
                                .setDescription("What do you want to suggest?")
                                .setRequired(true)
                        )
                )
        );
    }

    /**
     * Execute Slash Subcommand (Report)
     */
    async chatInputReport(interaction: ChatInputCommandInteraction) {
        const { devReports, util } = this.container;
        const { options, user } = interaction;

        const reportType = options.getString("report", true);

        const modal = util
            .modal()
            .setCustomId(`${reportType}-modal`)
            .setTitle(`Report ${reportType} to the Bot Developer`)
            .setComponents(
                util
                    .modalRow()
                    .setComponents(
                        util
                            .input()
                            .setCustomId("report_explanation")
                            .setLabel(`Explain your ${reportType} here`)
                            .setPlaceholder(
                                "Please provide as much details if you can (You can use Discord Markdown)"
                            )
                            .setStyle(TextInputStyle.Paragraph)
                            .setMinLength(10)
                            .setMaxLength(1000)
                            .setRequired(true)
                    )
            );

        await interaction.showModal(modal);

        const mInteraction = await interaction.awaitModalSubmit({
            filter: (i) => i.customId === `${reportType}-modal`,
            time: 0
        });

        const { fields } = mInteraction;

        const report = fields.getTextInputValue("report_explanation");

        const embed = util
            .embed()
            .setTitle(`${reportType} Report by ${user.tag}`)
            .setDescription(report);

        await devReports.send({ embeds: [embed] });

        return mInteraction.reply({
            content: `Sent the ${reportType} Report to the Bot Developer`,
            ephemeral: true
        });
    }

    /**
     * Excute Slash Subcommand (Suggest)
     */
    async chatInputSuggest(interaction: ChatInputCommandInteraction) {
        const { devSuggestions, util } = this.container;
        const { options, user } = interaction;

        const suggestionType = options.getString("suggestion", true);

        const modal = util
            .modal()
            .setCustomId(`${suggestionType}-modal`)
            .setTitle(`Report ${suggestionType} to the Bot Developer`)
            .setComponents(
                util
                    .modalRow()
                    .setComponents(
                        util
                            .input()
                            .setCustomId("report_explanation")
                            .setLabel(`Explain your ${suggestionType} here`)
                            .setPlaceholder(
                                "Please provide as much details if you can (You can use Discord Markdown)"
                            )
                            .setStyle(TextInputStyle.Paragraph)
                            .setMinLength(10)
                            .setMaxLength(1000)
                            .setRequired(true)
                    )
            );

        await interaction.showModal(modal);

        const mInteraction = await interaction.awaitModalSubmit({
            filter: (i) => i.customId === `${suggestionType}-modal`,
            time: 0
        });

        const { fields } = mInteraction;

        const suggestion = fields.getTextInputValue("report_explanation");

        const embed = util
            .embed()
            .setTitle(`${suggestionType} Suggestion by ${user.tag}`)
            .setDescription(suggestion);

        await devSuggestions.send({ embeds: [embed] });

        return mInteraction.reply({
            content: `Sent the ${suggestionType} Suggestion to the Bot Developer`,
            ephemeral: true
        });
    }
}
