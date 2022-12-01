import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, TextInputStyle } from "discord.js";
import { inspect } from "util";

export class EvalCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "eval",
            description: "Evaluate Javascript Code",
            preconditions: ["OwnerOnly"]
        });
    }

    /**
     * Register Slash Command
     */
    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { util } = this.container;

        const modal = util
            .modal()
            .setCustomId("eval-modal")
            .setTitle("Evaluating Javascript")
            .setComponents(
                util
                    .modalRow()
                    .setComponents(
                        util
                            .input()
                            .setCustomId("code")
                            .setLabel("Code to evaluate")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Paragraph)
                    )
            );

        await interaction.showModal(modal);

        const mInteraction = await interaction.awaitModalSubmit({ time: 0 });

        const code = mInteraction.fields.getTextInputValue("code");

        try {
            const evaled = eval(code);
            const cleaned = await this.clean(evaled);

            const embed = util
                .embed()
                .setDescription(`\`\`\`js\n${cleaned}\n\`\`\``);

            return mInteraction.reply({
                embeds: [embed],
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            return mInteraction.reply({
                content: `\`\`\`xl\n${err}\n\`\`\``,
                ephemeral: true
            });
        }
    }

    private async clean(text: any) {
        const { client } = this.container;

        if (text && text.constructor.name === "Promise") text = await text;

        if (typeof text !== "string") text = inspect(text, { depth: 1 });

        text = text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203));

        text = text.replaceAll(client.token, "[REDACTED]");

        return text;
    }
}
