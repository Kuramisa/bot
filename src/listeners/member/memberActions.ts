import { Listener } from "@sapphire/framework";
import { ButtonInteraction } from "discord.js";

export class MemberActionsListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Buttons for Member Embed",
            event: "interactionCreate"
        });
    }

    public async run(interaction: ButtonInteraction<"cached">) {
        if (!interaction.isButton()) return;

        if (
            ![
                "show_rank",
                "show_warns",
                "show_reports",
                "kick_member",
                "ban_member",
                "report_member",
                "warn_member"
            ].includes(interaction.customId)
        )
            return;

        const { canvas, moderation, util } = this.container;

        const { guild, message, member } = interaction;

        const target = await guild.members.fetch(
            message.embeds[0].footer?.text.split(":")[1] as string
        );

        switch (interaction.customId) {
            case "show_rank": {
                const attachment = await canvas.member.card(target.user);
                if (!attachment)
                    return interaction.reply({
                        content: "Could not retrieve rank card",
                        ephemeral: true
                    });

                return interaction.reply({
                    files: [attachment],
                    ephemeral: true
                });
            }
            case "kick_member": {
                if (
                    !member.permissions.has("KICK_MEMBERS") ||
                    !guild.me?.permissions.has("KICK_MEMBERS")
                )
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true
                    });

                if (!target.kickable)
                    return interaction.reply({
                        content: `${target} is not kickable`,
                        ephemeral: true
                    });

                const modal = util
                    .modal()
                    .setCustomId("kick-member-modal")
                    .setTitle(`Kicking ${target.user.tag}`)
                    .setComponents(
                        util
                            .modalRow()
                            .setComponents(
                                util
                                    .input()
                                    .setCustomId("kick-reason")
                                    .setLabel("Reason")
                                    .setRequired(true)
                                    .setStyle("SHORT")
                            )
                    );

                await interaction.showModal(modal);

                const mInteraction = await interaction.awaitModalSubmit({
                    time: 0
                });

                const reason =
                    mInteraction.fields.getTextInputValue("kick-reason");

                await target.kick(
                    `Kicked by ${member.user.tag}, Reason: ${reason}`
                );

                return mInteraction.reply({
                    content: `You kicked ${target.user.tag} from the server`,
                    ephemeral: true
                });
            }
            case "ban_member": {
                if (
                    !member.permissions.has("BAN_MEMBERS") ||
                    !guild.me?.permissions.has("BAN_MEMBERS")
                )
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true
                    });

                if (!target.bannable)
                    return interaction.reply({
                        content: `${target} is not bannable`,
                        ephemeral: true
                    });

                const modal = util
                    .modal()
                    .setCustomId("ban-member-modal")
                    .setTitle(`Banning ${target.user.tag}`)
                    .setComponents(
                        util
                            .modalRow()
                            .setComponents(
                                util
                                    .input()
                                    .setCustomId("ban-reason")
                                    .setLabel("Reason")
                                    .setRequired(true)
                                    .setStyle("SHORT")
                            ),
                        util
                            .modalRow()
                            .setComponents(
                                util
                                    .input()
                                    .setCustomId("messages-days")
                                    .setLabel("Days of messages to delete")
                                    .setStyle("SHORT")
                                    .setRequired(false)
                                    .setMinLength(1)
                                    .setMaxLength(1)
                                    .setPlaceholder("Please enter a number")
                            )
                    );

                await interaction.showModal(modal);

                const mInteraction = await interaction.awaitModalSubmit({
                    time: 0
                });

                const reason =
                    mInteraction.fields.getTextInputValue("ban-reason");

                let days = parseInt(
                    mInteraction.fields.getTextInputValue("messages-days")
                );

                if (!days)
                    return mInteraction.reply({
                        content: "Please provide a number of days (0-7)",
                        ephemeral: true
                    });

                days = util.daysToSecs(days);

                if (days < 0)
                    return mInteraction.reply({
                        content: "Provided days are less than 0",
                        ephemeral: true
                    });
                if (days > 7)
                    return mInteraction.reply({
                        content: "Provided days are more than 7",
                        ephemeral: true
                    });

                await target.ban({
                    reason: `Banned by ${target.user.tag}, Reason: ${reason}`,
                    deleteMessageSeconds: days
                });

                return mInteraction.reply({
                    content: `You banned ${target.user.tag} from the server`,
                    ephemeral: true
                });
            }
            case "report_member": {
                const modal = moderation.reports.modal(target);

                return interaction.showModal(modal);
            }
            case "warn_member": {
                if (!member.permissions.has("MODERATE_MEMBERS"))
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true
                    });
                const modal = moderation.warns.modal(target);

                return interaction.showModal(modal);
            }
            case "show_reports": {
                if (!member.permissions.has("VIEW_AUDIT_LOG"))
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true
                    });
                const reports = await moderation.reports.get(target);
                if (!reports || reports.length < 1)
                    return interaction.reply({
                        content: `${target} has no reports`,
                        ephemeral: true
                    });
                const mapped = reports.map(
                    (report) => `
                    \`Reported by\`: ${guild.members.cache.get(report.by)}
                    \`Reason\`: ${report.reason}
                `
                );

                return util.pagination.default(
                    interaction,
                    mapped,
                    `${target.user.tag} Reports`,
                    true
                );
            }
            case "show_warns": {
                if (!member.permissions.has("VIEW_AUDIT_LOG"))
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true
                    });
                const warns = await moderation.warns.get(target);
                if (!warns || warns.length < 1)
                    return interaction.reply({
                        content: `${target} has no warns`,
                        ephemeral: true
                    });
                const mapped = warns.map(
                    (warn) => `
                    \`Warned by\`: ${guild.members.cache.get(warn.by)}
                    \`Reason\`: ${warn.reason}
                `
                );

                return util.pagination.default(
                    interaction,
                    mapped,
                    `${target.user.tag} Warns`,
                    true
                );
            }
        }
    }
}
