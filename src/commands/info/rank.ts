import { Command, Args } from "@sapphire/framework";
import { ChatInputCommandInteraction, Message } from "discord.js";

export class RankCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "rank",
            description: "Look at your or someone's rank",
        });
    }

    /**
     * Register Slash Command
     */
    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("Who's rank do you want to view")
                        .setRequired(false)
                )
        );
    }

    /**
     * Execute Message Command
     */
    async messageRun(message: Message, args: Args) {
        const user = await args.pick("user").catch(() => message.author);

        if (!user) return message.reply("User not found");

        if (user.bot) return message.reply(`${user} is a bot`);

        const attachment = await this.container.canvas.member.card(user);
        if (!attachment) return message.reply("Failed to get rank card");

        return message.reply({ files: [attachment] });
    }

    /**
     * Execute Slash Command
     */
    async chatInputRun(interaction: ChatInputCommandInteraction<"cached">) {
        let user = interaction.options.getUser("user");

        if (!user) user = interaction.user;

        if (user.bot)
            return interaction.reply({
                content: `${user} is a bot`,
                ephemeral: true,
            });

        const attachment = await this.container.canvas.member.card(user);

        if (!attachment)
            return interaction.reply({
                content: "Failed to get rank card",
                ephemeral: true,
            });

        return interaction.reply({ files: [attachment] });
    }
}
