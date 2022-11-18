import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";

export class WarnsCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "warns",
            description: "Check warns of a member",
            requiredUserPermissions: "ViewAuditLog"
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(1 << 7)
                .addUserOption((option) =>
                    option
                        .setName("member")
                        .setDescription("Member to check warns of")
                        .setRequired(true)
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction<"cached">) {
        const {
            moderation,
            util: { pagination }
        } = this.container;
        const { options, guild } = interaction;

        const member = options.getMember("member");

        if (!member) return;

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true
            });

        const warns = await moderation.warns.get(member);

        if (!warns || warns.length < 1)
            return interaction.reply({
                content: `${member} has no warns`,
                ephemeral: true
            });

        const warnMap = warns.map(
            (warn) =>
                `**Warned by**: ${guild.members.cache.get(
                    warn.by
                )}\n**Reason**: ${warn.reason}`
        );

        return pagination.default(
            interaction,
            warnMap,
            `${member.user.tag}'s Warns`,
            true
        );
    }
}
