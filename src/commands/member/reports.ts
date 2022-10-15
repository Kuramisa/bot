import { Command } from "@sapphire/framework";

export class ReportsCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "reports",
            description: "Check reports of a member",
            requiredUserPermissions: "VIEW_AUDIT_LOG"
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
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

    public async chatInputRun(
        interaction: Command.ChatInputInteraction<"cached">
    ) {
        const {
            moderation,
            util: { pagination }
        } = this.container;

        const { options } = interaction;

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
}
