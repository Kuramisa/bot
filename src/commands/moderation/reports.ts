import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, ComponentType } from "discord.js";

export class ReportsCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "reports",
            description: "Check reports of a member",
            requiredUserPermissions: "ViewAuditLog",
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
                        .setName("remove")
                        .setDescription("Remove a report from a member")
                        .addUserOption((option) =>
                            option
                                .setName("member")
                                .setDescription("Member to remove warns of")
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("clear")
                        .setDescription("Clear Member's all reports")
                        .addUserOption((option) =>
                            option
                                .setName("member")
                                .setDescription("Member to clear reports of")
                                .setRequired(true)
                        )
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const { client, moderation, util } = this.container;

        const { options } = interaction;

        const member = options.getMember("member");

        if (!member) return;

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true,
            });

        const reports = await moderation.reports.get(member);

        if (!reports || reports.length < 1)
            return interaction.reply({
                content: `${member} has no reports`,
                ephemeral: true,
            });

        switch (options.getSubcommand()) {
            case "view": {
                const reportMap = reports.map(
                    (report) =>
                        `**Reported by**: <@${report.by}>\n**Reason**: ${report.reason}`
                );

                return util.pagination.default(
                    interaction,
                    reportMap,
                    `${member.user.tag} Reports`,
                    true
                );
            }
            case "remove": {
                const opts = await Promise.all(
                    reports.map(async (report) => ({
                        label: `Reason: ${report.by} - Warned by: ${
                            (
                                await client.users.fetch(report.by, {
                                    force: true,
                                })
                            ).username
                        }`,
                        value: report.id,
                    }))
                );

                const embed = util
                    .embed()
                    .setTitle(`Removing Reports of ${member.user.username}`);

                const row = util
                    .row()
                    .setComponents(
                        util
                            .stringMenu()
                            .setCustomId("select_member_report")
                            .setMinValues(1)
                            .setMaxValues(opts.length)
                            .setOptions(opts)
                    );

                const message = await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    fetchReply: true,
                });

                const sInteraction = await message.awaitMessageComponent({
                    componentType: ComponentType.StringSelect,
                    filter: (i) =>
                        i.customId === "select_member_report" &&
                        i.user.id === interaction.user.id,
                });

                const { values } = sInteraction;

                const reportsRemoved = [];

                for (const value of values) {
                    reportsRemoved.push(
                        (await moderation.reports.get(member))?.find(
                            (report) => report.id === value
                        )
                    );
                    await moderation.reports.remove(value, member);
                }

                await sInteraction.deferUpdate();
                await message.edit({
                    embeds: [
                        embed
                            .setTitle(
                                `Removed reports of ${member.user.username}`
                            )
                            .setDescription(
                                reportsRemoved
                                    .map(
                                        (report) =>
                                            `Reason: ${report?.reason} - Warned by: <@${report?.by}>`
                                    )
                                    .join("\n")
                            ),
                    ],
                    components: [],
                });
                break;
            }
            case "clear": {
                await moderation.reports.clear(member);
                await interaction.reply({
                    content: `Cleared reports for ${member}`,
                    ephemeral: true,
                });
                break;
            }
        }
    }
}
