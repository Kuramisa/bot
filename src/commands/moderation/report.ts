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
            builder.setName("Report Member").setType(2).setDMPermission(false)
        );

        registry.registerContextMenuCommand((builder) =>
            builder.setName("Report Message").setType(3).setDMPermission(false)
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

    public async contextMenuRun(
        interaction: Command.ContextMenuInteraction<"cached">
    ) {
        const {
            moderation: { reports }
        } = this.container;

        const { guild, channel, targetId } = interaction;

        switch (interaction.commandName) {
            case "Report Member": {
                const member = await guild.members.fetch(targetId);
                if (member.user.bot)
                    return interaction.reply({
                        content: `${member} is a bot`,
                        ephemeral: true
                    });

                return interaction.showModal(reports.modal(member));
            }
            case "Report Message": {
                if (!channel) return;
                const message = await channel.messages.fetch(targetId);
                if (!message.inGuild()) return;
                const member = message.member;
                if (!member) return;

                if (member.user.bot)
                    return interaction.reply({
                        content: `${member} is a bot`,
                        ephemeral: true
                    });

                await interaction.showModal(reports.messageModal(member));

                const mInteraction = await interaction.awaitModalSubmit({
                    time: 0,
                    filter: (i) =>
                        i.customId === `report_member_${member.id}_message`
                });

                return reports.createMessageReport(
                    mInteraction,
                    member,
                    message,
                    mInteraction.fields.getTextInputValue("report_reason")
                );
            }
        }
    }
}
