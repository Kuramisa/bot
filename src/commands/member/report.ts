import { Command } from "@sapphire/framework";

export class ReportCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "report",
            description: "Report a member"
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) =>
                    option
                        .setName("member")
                        .setDescription("Member to report")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("reason")
                        .setDescription("Reason to report this member")
                )
        );

        registry.registerContextMenuCommand((builder) =>
            builder.setName("Report").setType(2).setDMPermission(false)
        );
    }

    public async chatInputRun(
        interaction: Command.ChatInputInteraction<"cached">
    ) {
        const {
            moderation: { reports }
        } = this.container;

        const { options } = interaction;

        const member = options.getMember("member");
        const reason = options.getString("reason") || "No reason specified";

        if (!member) return;

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true
            });

        return reports.create(interaction, member, reason);
    }
}
