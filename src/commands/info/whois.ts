import { Args, Command } from "@sapphire/framework";
import {
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    Message,
} from "discord.js";

export class MemberCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "whois",
            aliases: ["user"],
            description: "Information about a member",
            runIn: "GUILD_ANY",
        });
    }

    /**
     * Register Slash Command and Context Menu
     */
    override registerApplicationCommands(registry: Command.Registry) {
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
    async messageRun(message: Message, args: Args) {
        const member = await args.pick("member").catch(() => message.member);

        if (!member || !message.member)
            return message.reply("Member not found");

        if (member.user.bot) return message.reply(`${member} is a bot`);

        const options = await this.container.util.member.info(
            message.member,
            member
        );

        return message.reply(options as any);
    }

    /**
     * Execute Slash Command
     */
    async chatInputRun(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        let member = interaction.options.getMember("member");

        if (!member) member = interaction.member;

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true,
            });

        const options = await this.container.util.member.info(
            interaction.member,
            member
        );

        return interaction.reply(options as any);
    }

    /**
     * Execute Context Menu
     */
    async contextMenuRun(interaction: ContextMenuCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const { guild, targetId } = interaction;

        const member = await guild.members.fetch(targetId);
        if (!member)
            return interaction.reply({
                content: "Member not found",
                ephemeral: true,
            });

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true,
            });

        const options = await this.container.util.member.info(
            interaction.member,
            member
        );

        return interaction.reply(options as any);
    }
}
