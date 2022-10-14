import { Command, Args } from "@sapphire/framework";
import { Message } from "discord.js";

export class MemberCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "member",
            aliases: ["user"],
            description: "Information about a member",
            runIn: "GUILD_ANY"
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
                .setDMPermission(false)
                .addUserOption((option) =>
                    option
                        .setName("member")
                        .setDescription(
                            "Which user's information do you want to view?"
                        )
                        .setRequired(false)
                )
        );

        registry.registerContextMenuCommand((builder) =>
            builder.setName("Member Info").setDMPermission(false).setType(2)
        );
    }

    /**
     * Execute Message Command
     */
    public async messageRun(message: Message, args: Args) {
        const member = await args.pick("member").catch(() => message.member);

        if (!member || !message.member)
            return message.reply("Member not found");

        if (member.user.bot) return message.reply(`${member} is a bot`);

        const options = await this.container.util.member.info(
            message.member,
            member
        );

        return message.reply(options);
    }

    /**
     * Execute Slash Command
     */
    public async chatInputRun(
        interaction: Command.ChatInputInteraction<"cached">
    ) {
        let member = interaction.options.getMember("member");

        if (!member) member = interaction.member;

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true
            });

        const options = await this.container.util.member.info(
            interaction.member,
            member
        );

        return interaction.reply(options);
    }

    /**
     * Execute Context Menu
     */
    public async contextMenuRun(
        interaction: Command.ContextMenuInteraction<"cached">
    ) {
        const { guild, targetId } = interaction;

        const member = await guild.members.fetch(targetId);
        if (!member)
            return interaction.reply({
                content: "Member not found",
                ephemeral: true
            });

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true
            });

        const options = await this.container.util.member.info(
            interaction.member,
            member
        );

        return interaction.reply(options);
    }
}
