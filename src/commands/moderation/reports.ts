import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";

export class ReportsCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "reports",
            description: "Check reports of a member",
            requiredUserPermissions: "ViewAuditLog"
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(1 << 7)
                .addSubcommand((command) =>
                    command
                        .setName("view")
                        .setDescription("View Member's Reports")
                        .addUserOption((option) =>
                            option
                                .setName("member")
                                .setDescription("Member to check reports of")
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("clear")
                        .setDescription("remove Member's all reports")
                        .addUserOption((option) =>
                            option
                                .setName("member")
                                .setDescription("Member to clear reports of")
                                .setRequired(true)
                        )
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction<"cached">) {
        const {
            moderation,
            util: { pagination }
        } = this.container;

        const { options } = interaction;

        switch (options.getSubcommand()) {
            case "view": {
                const member = options.getMember("member");

                if (!member) return;

                if (member.user.bot)
                    return interaction.reply({
                        content: `${member} is a bot`,
                        ephemeral: true
                    });

                const guild = interaction.guild;
                if (!guild) return;

                const reports = await moderation.reports.get(member);

                if (!reports || reports.length < 1)
                    return interaction.reply({
                        content: `${member} has no reports`,
                        ephemeral: true
                    });

                const reportMap = reports.map(
                    (report) =>
                        `**Reported by**: ${guild.members.cache.get(
                            report.by
                        )}\n**Reason**: ${report.reason}`
                );

                return pagination.default(
                    interaction,
                    reportMap,
                    `${member.user.tag} Reports`,
                    true
                );
            }
            case "clear": {
                const member = options.getMember("member");

                if (!member) return;

                if (member.user.bot)
                    return interaction.reply({
                        content: `${member} is a bot`,
                        ephemeral: true
                    });

                const reports = await moderation.reports.get(member);

                if (!reports || reports.length < 1)
                    return interaction.reply({
                        content: `${member} has no reports`,
                        ephemeral: true
                    });

                return moderation.reports.clear(interaction, member);
            }
        }
    }
}
