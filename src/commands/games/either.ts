import { Command } from "@sapphire/framework";
import { Message, MessageActionRowComponent, MessageButton } from "discord.js";
import WYR from "either-wyr";

export class EitherCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "either",
            description: "Would you rather?",
            aliases: ["wouldyourather"]
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
    }

    public async chatInputRun(
        interaction: Command.ChatInputInteraction<"cached">
    ) {
        const { util } = this.container;

        let wyr = await this.getQuestion();

        const message = await interaction.reply({
            embeds: [wyr.embed],
            components: [wyr.row],
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            componentType: "BUTTON",
            filter: (i) =>
                (i.customId === "question_1_btn" ||
                    i.customId === "question_2_btn" ||
                    i.customId === "next_question") &&
                i.user.id === interaction.user.id,
            time: 30000
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "question_1_btn":
                    case "question_2_btn":
                        const buttons = wyr.row.components.map(
                            (button: any, i) => {
                                const question = wyr.questions[i];
                                if (button.customId === "next_question")
                                    return button;
                                return button
                                    .setLabel(
                                        `${question.question} - ${question.percentage}%`
                                    )
                                    .setDisabled(true);
                            }
                        );

                        const row = util.row().setComponents(buttons);
                        const embed = wyr.embed.setDescription(
                            `You chose ${i.component.label}`
                        );

                        await i.update({ embeds: [embed], components: [row] });
                        break;
                    case "next_question": {
                        wyr = await this.getQuestion();

                        await i.update({
                            embeds: [wyr.embed],
                            components: [wyr.row]
                        });
                        break;
                    }
                }

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete")
                    message.delete().catch(() => {});
            });
    }

    public async messageRun(message: Message) {
        const { util } = this.container;

        let wyr = await this.getQuestion();

        const msg = await message.reply({
            embeds: [wyr.embed],
            components: [wyr.row]
        });

        const collector = msg.createMessageComponentCollector({
            componentType: "BUTTON",
            filter: (i) =>
                (i.customId === "question_1_btn" ||
                    i.customId === "question_2_btn" ||
                    i.customId === "next_question") &&
                i.user.id === message.author.id,
            time: 30000
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "question_1_btn":
                    case "question_2_btn":
                        const buttons = wyr.row.components.map(
                            (button: any, i) => {
                                const question = wyr.questions[i];
                                if (button.customId === "next_question")
                                    return button;
                                return button
                                    .setLabel(
                                        `${question.question} - ${question.percentage}%`
                                    )
                                    .setDisabled(true);
                            }
                        );

                        const row = util.row().setComponents(buttons);
                        const embed = wyr.embed.setDescription(
                            `You chose ${i.component.label}`
                        );

                        await i.update({ embeds: [embed], components: [row] });
                        break;
                    case "next_question": {
                        wyr = await this.getQuestion();

                        await i.update({
                            embeds: [wyr.embed],
                            components: [wyr.row]
                        });
                        break;
                    }
                }

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete")
                    message.delete().catch(() => {});
            });
    }

    private async getQuestion() {
        const { util } = this.container;

        const wyr = await WYR();

        const embed = util
            .embed()
            .setAuthor({ name: wyr.author })
            .setTitle("Would you rather?");

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("question_1_btn")
                    .setLabel(wyr.questions[0].question)
                    .setStyle("PRIMARY"),
                util
                    .button()
                    .setCustomId("question_2_btn")
                    .setLabel(wyr.questions[1].question)
                    .setStyle("DANGER"),
                util
                    .button()
                    .setCustomId("next_question")
                    .setLabel("Next Question")
                    .setStyle("SECONDARY")
            );

        return { questions: wyr.questions, embed, row };
    }
}
