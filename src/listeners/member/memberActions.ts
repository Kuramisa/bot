import { Listener } from "@sapphire/framework";
import { ButtonInteraction, TextInputStyle } from "discord.js";

export class MemberActionsListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Buttons for Member Embed",
            event: "interactionCreate",
        });
    }

    async run(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        if (
            ![
                "show_rank",
                "show_warns",
                "show_reports",
                "kick_member",
                "ban_member",
                "report_member",
                "warn_member",
            ].includes(interaction.customId)
        )
            return;

        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This button can only be used in a server",
                ephemeral: true,
            });

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
                        ephemeral: true,
                    });

                return interaction.reply({
                    files: [attachment],
                    ephemeral: true,
                });
            }
            case "kick_member": {
                if (
                    !member.permissions.has("KickMembers") ||
                    !guild.members.me?.permissions.has("KickMembers")
                )
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true,
                    });

                if (!target.kickable)
                    return interaction.reply({
                        content: `${target} is not kickable`,
                        ephemeral: true,
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
                                    .setStyle(TextInputStyle.Short)
                            )
                    );

                await interaction.showModal(modal);

                const mInteraction = await interaction.awaitModalSubmit({
                    time: 0,
                });

                const reason =
                    mInteraction.fields.getTextInputValue("kick-reason");

                await target.kick(
                    `Kicked by ${member.user.tag}, Reason: ${reason}`
                );

                return mInteraction.reply({
                    content: `You kicked ${target.user.tag} from the server`,
                    ephemeral: true,
                });
            }
            case "ban_member": {
                if (
                    !member.permissions.has("BanMembers") ||
                    !guild.members.me?.permissions.has("BanMembers")
                )
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true,
                    });

                if (!target.bannable)
                    return interaction.reply({
                        content: `${target} is not bannable`,
                        ephemeral: true,
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
                                    .setStyle(TextInputStyle.Short)
                            ),
                        util
                            .modalRow()
                            .setComponents(
                                util
                                    .input()
                                    .setCustomId("messages-days")
                                    .setLabel("Days of messages to delete")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(false)
                                    .setMinLength(1)
                                    .setMaxLength(1)
                                    .setPlaceholder("Please enter a number")
                            )
                    );

                await interaction.showModal(modal);

                const mInteraction = await interaction.awaitModalSubmit({
                    time: 0,
                });

                const reason =
                    mInteraction.fields.getTextInputValue("ban-reason");

                let days = parseInt(
                    mInteraction.fields.getTextInputValue("messages-days")
                );

                if (!days)
                    return mInteraction.reply({
                        content: "Please provide a number of days (0-7)",
                        ephemeral: true,
                    });

                days = util.daysToSecs(days);

                if (days < 0)
                    return mInteraction.reply({
                        content: "Provided days are less than 0",
                        ephemeral: true,
                    });
                if (days > 7)
                    return mInteraction.reply({
                        content: "Provided days are more than 7",
                        ephemeral: true,
                    });

                await target.ban({
                    reason: `Banned by ${target.user.tag}, Reason: ${reason}`,
                    deleteMessageSeconds: days,
                });

                return mInteraction.reply({
                    content: `You banned ${target.user.tag} from the server`,
                    ephemeral: true,
                });
            }
            case "report_member": {
                const modal = moderation.reports.modal(target);

                await interaction.showModal(modal);

                const mIntereaction = await interaction.awaitModalSubmit({
                    time: 0,
                });

                const reason =
                    mIntereaction.fields.getTextInputValue("report-reason");

                await moderation.reports.create(target, member, reason);

                return interaction.reply({
                    content: `You reported ${target.user.tag}`,
                    ephemeral: true,
                });
            }
            case "warn_member": {
                if (!member.permissions.has("ModerateMembers"))
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true,
                    });
                const modal = moderation.warns.modal(target);

                await interaction.showModal(modal);

                const mInteraction = await interaction.awaitModalSubmit({
                    time: 0,
                });

                const reason =
                    mInteraction.fields.getTextInputValue("warn-reason");

                await moderation.warns.create(target, member, reason);

                return interaction.reply({
                    content: `You warned ${target.user.tag}`,
                    ephemeral: true,
                });
            }
            case "show_reports": {
                if (!member.permissions.has("ViewAuditLog"))
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true,
                    });
                const reports = await moderation.reports.get(target);
                if (!reports || reports.length < 1)
                    return interaction.reply({
                        content: `${target} has no reports`,
                        ephemeral: true,
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
                if (!member.permissions.has("ViewAuditLog"))
                    return interaction.reply({
                        content: "Not enough permissions",
                        ephemeral: true,
                    });
                const warns = await moderation.warns.get(target);
                if (!warns || warns.length < 1)
                    return interaction.reply({
                        content: `${target} has no warns`,
                        ephemeral: true,
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
