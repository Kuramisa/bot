import { Command } from "@sapphire/framework";
import {
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ComponentType,
    PermissionsBitField,
    TextInputStyle,
} from "discord.js";

export class RulesCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "rules",
            description: "Set/Check/Edit Rules",
            requiredUserPermissions: "ManageGuild",
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(
                    PermissionsBitField.Flags.ManageGuild |
                        PermissionsBitField.Flags.ManageRoles
                )
                .addSubcommand((command) =>
                    command
                        .setName("setup")
                        .setDescription("Setup some rules")
                        .addChannelOption((option) =>
                            option
                                .setName("rules_channel")
                                .setDescription("Channel to setup rules at")
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                        )
                        .addNumberOption((option) =>
                            option
                                .setName("rules_button_style")
                                .setDescription("Button Style")
                                .setRequired(false)
                                .setChoices(
                                    {
                                        name: "Blurple",
                                        value: ButtonStyle.Primary,
                                    },
                                    {
                                        name: "Grey",
                                        value: ButtonStyle.Secondary,
                                    },
                                    {
                                        name: "Green",
                                        value: ButtonStyle.Success,
                                    },
                                    {
                                        name: "Red",
                                        value: ButtonStyle.Danger,
                                    }
                                )
                        )
                        .addStringOption((option) =>
                            option
                                .setName("rules_button_emoji")
                                .setDescription("Button Emoji")
                                .setRequired(false)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("roles")
                        .setDescription("Set what roles rules should give out")
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { database, util } = this.container;

        const { options, guild } = interaction;
        if (!guild) return;

        const db = await database.guilds.get(guild);

        switch (options.getSubcommand()) {
            case "setup": {
                const modal = util
                    .modal()
                    .setCustomId("rules_create")
                    .setTitle("Rules Creation")
                    .setComponents(
                        util
                            .modalRow()
                            .setComponents(
                                util
                                    .input()
                                    .setCustomId("rules_input_create")
                                    .setLabel("Rules Message")
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            )
                    );

                await interaction.showModal(modal);

                const mInteraction = await interaction.awaitModalSubmit({
                    time: 0,
                });

                const roleMenu = util
                    .row()
                    .setComponents(
                        util
                            .roleMenu()
                            .setCustomId("rules_role_menu")
                            .setPlaceholder(
                                "Select roles to give out after accepting rules"
                            )
                            .setMinValues(1)
                            .setMaxValues(25)
                    );

                const message = await mInteraction.reply({
                    components: [roleMenu],
                    ephemeral: true,
                    fetchReply: true,
                });

                const rInteraction = await message.awaitMessageComponent({
                    componentType: ComponentType.RoleSelect,
                });

                await rInteraction.deferUpdate();

                const { values, roles } = rInteraction;

                const apiChannel = options.getChannel("rules_channel", true);
                const channel = await guild.channels.fetch(apiChannel.id);
                if (!channel || !channel.isTextBased())
                    return interaction.reply({
                        content: "Text channel is not provided",
                        ephemeral: true,
                    });

                const rulesMessage =
                    mInteraction.fields.getTextInputValue("rules_input_create");
                const buttonStyle = options.getNumber("rules_button_style");

                const button = util
                    .button()
                    .setCustomId("accept_rules")
                    .setLabel("Accept Rules")
                    .setStyle(
                        buttonStyle ? buttonStyle : ButtonStyle.Secondary
                    );

                const buttonEmoji = options.getString("rules_button_emoji");

                if (buttonEmoji) button.setEmoji(buttonEmoji);

                const row = util.row().setComponents(button);

                // Message that was sent to the rules channel
                const rMessage = await channel.send({
                    content: rulesMessage,
                    components: [row],
                });

                const embed = util
                    .embed()
                    .setTitle("Rules Created")
                    .setDescription(
                        `Check ${channel}\n\nRoles upon accepting: ${roles
                            .map((role) => `${role}`)
                            .join(", ")}`
                    );

                db.rules = {
                    channelId: channel.id,
                    messageId: rMessage.id,
                    roles: values,
                };

                await db.save();

                return rInteraction.update({
                    embeds: [embed],
                });
            }
            case "roles": {
                const roleMenu = util
                    .row()
                    .setComponents(
                        util
                            .roleMenu()
                            .setCustomId("rules_role_menu")
                            .setPlaceholder(
                                "Select roles to give out after accepting rules"
                            )
                            .setMinValues(1)
                            .setMaxValues(25)
                    );

                const message = await interaction.reply({
                    components: [roleMenu],
                    ephemeral: true,
                    fetchReply: true,
                });

                const rInteraction = await message.awaitMessageComponent({
                    componentType: ComponentType.RoleSelect,
                });

                await rInteraction.deferUpdate();

                const { values, roles } = rInteraction;
                const embed = util
                    .embed()
                    .setDescription(
                        `Roles upon accepting changed to: ${roles
                            .map((role) => `${role}`)
                            .join(", ")}`
                    );

                db.rules.roles = values;

                await db.save();

                return rInteraction.editReply({
                    embeds: [embed],
                    components: [],
                });
            }
        }
    }
}
