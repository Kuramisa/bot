import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, ComponentType } from "discord.js";

export class WarnsCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "warns",
            description: "Check warns of a member",
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
                        .setDescription("View member's reports")
                        .addUserOption((option) =>
                            option
                                .setName("member")
                                .setDescription("Member of check warns of")
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("remove")
                        .setDescription("Remove a warn from a member")
                        .addUserOption((option) =>
                            option
                                .setName("member")
                                .setDescription("Member of remove warns of")
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
                                .setDescription("Member of check warns of")
                                .setRequired(true)
                        )
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction<"cached">) {
        const { client, moderation, util } = this.container;

        const { options } = interaction;

        const member = options.getMember("member");

        if (!member) return;

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true,
            });

        const warns = await moderation.warns.get(member);

        if (!warns || warns.length < 1)
            return interaction.reply({
                content: `${member} has no warns`,
                ephemeral: true,
            });

        switch (options.getSubcommand()) {
            case "view": {
                const warnMap = warns.map(
                    (warn) =>
                        `**Warned by**: <@${warn.by}>\n**Reason**: ${warn.reason}`
                );

                return util.pagination.default(
                    interaction,
                    warnMap,
                    `${member.user.tag}'s Warns`,
                    true
                );
            }
            case "remove": {
                const opts = await Promise.all(
                    warns.map(async (warn) => ({
                        label: `Reason: ${warn.reason} - Warned by: ${
                            (
                                await client.users.fetch(warn.by)
                            )?.username
                        }`,
                        value: warn.id,
                    }))
                );

                const embed = util
                    .embed()
                    .setTitle(`Removing Warns of ${member.user.username}`);

                const row = util
                    .row()
                    .setComponents(
                        util
                            .stringMenu()
                            .setCustomId("select_member_warn")
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
                        i.customId === "select_member_warn" &&
                        i.user.id === interaction.user.id,
                });

                const { values } = sInteraction;

                const warnsRemoved = [];

                for (const value of values) {
                    warnsRemoved.push(
                        (await moderation.warns.get(member))?.find(
                            (warn) => warn.id === value
                        )
                    );
                    await moderation.warns.remove(value, member);
                }

                await sInteraction.deferUpdate();
                await message.edit({
                    embeds: [
                        embed
                            .setTitle(
                                `Removed warns of ${member.user.username}`
                            )
                            .setDescription(
                                warnsRemoved
                                    .map(
                                        (warn) =>
                                            `Reason: ${warn?.reason} - Warned by: <@${warn?.by}>`
                                    )
                                    .join("\n")
                            ),
                    ],
                    components: [],
                });
                break;
            }
            case "clear": {
                await moderation.warns.clear(member);
                await interaction.reply({
                    content: `Cleared warns of ${member}`,
                    ephemeral: true,
                });
                break;
            }
        }
    }
}
