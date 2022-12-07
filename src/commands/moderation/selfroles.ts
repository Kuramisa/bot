import { Command } from "@sapphire/framework";
import { ButtonStyle, PermissionsBitField } from "discord.js";

export class SelfRolesCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "selfroles",
            description: "Setup self roles for server members",
            requiredClientPermissions: ["ManageRoles", "ManageChannels"],
            requiredUserPermissions: ["ManageRoles", "ManageChannels"],
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(
                    PermissionsBitField.Flags.ManageRoles |
                        PermissionsBitField.Flags.ManageChannels
                )
                .addSubcommand((command) =>
                    command
                        .setName("setup")
                        .setDescription(
                            "Automatically setup the channel and the message for self roles"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("channel_name")
                                .setDescription(
                                    "The name of the channel to create"
                                )
                                .setRequired(true)
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName("custom_message")
                                .setDescription(
                                    "Whether to use a custom message or not"
                                )
                                .setRequired(true)
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("message")
                        .setDescription(
                            "Add/Remove/Edit the message(s) for self roles"
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("add")
                                .setDescription("Add a message")
                                .addStringOption((option) =>
                                    option
                                        .setName("sr_channel_name")
                                        .setDescription(
                                            "The name of the channel to create a new message in"
                                        )
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                                .addBooleanOption((option) =>
                                    option
                                        .setName("custom_message")
                                        .setDescription(
                                            "Whether to use a custom message or not"
                                        )
                                        .setRequired(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("remove")
                                .setDescription("Remove a message")
                                .addStringOption((option) =>
                                    option
                                        .setName("sr_channel_name")
                                        .setDescription(
                                            "The name of the channel to remove the message from"
                                        )
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("sr_message")
                                        .setDescription("The message to remove")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("edit")
                                .setDescription("Edit a message")
                                .addStringOption((option) =>
                                    option
                                        .setName("sr_channel_name")
                                        .setDescription(
                                            "The name of the channel to edit the message in"
                                        )
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("sr_message")
                                        .setDescription("The message to edit")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("buttons")
                        .setDescription("Manage self roles buttons")
                        .addSubcommand((command) =>
                            command
                                .setName("add")
                                .setDescription("Add a button for a role")
                                .addStringOption((option) =>
                                    option
                                        .setName("sr_channel_name")
                                        .setDescription(
                                            "The name of the channel to add the button to"
                                        )
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("sr_message")
                                        .setDescription(
                                            "The message to add the button to"
                                        )
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                                .addRoleOption((option) =>
                                    option
                                        .setName("button_role")
                                        .setDescription("The role to add")
                                        .setRequired(true)
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("button_name")
                                        .setDescription(
                                            "The name of the button"
                                        )
                                        .setRequired(true)
                                )
                                .addNumberOption((option) =>
                                    option
                                        .setName("button_style")
                                        .setDescription(
                                            "The style of the button"
                                        )
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
                                        .setRequired(true)
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("button_emoji")
                                        .setDescription(
                                            "The emoji to use for the button"
                                        )
                                        .setRequired(false)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("remove")
                                .setDescription("Remove a button for a role")
                                .addStringOption((option) =>
                                    option
                                        .setName("sr_channel_name")
                                        .setDescription(
                                            "Channel name where the button is at"
                                        )
                                        .setRequired(true)
                                        .setAutocomplete(true)
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("sr_message")
                                        .setDescription(
                                            "Message where the button is at"
                                        )
                                        .setRequired(true)
                                        .setAutocomplete(true)
                                )
                        )
                )
        );
    }

    async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const { moderation } = this.container;

        const { options } = interaction;

        switch (options.getSubcommand()) {
            case "setup":
                return moderation.selfroles.setup(interaction);
        }

        switch (options.getSubcommandGroup()) {
            case "buttons":
                switch (options.getSubcommand()) {
                    case "add":
                        return moderation.selfroles.addButton(interaction);
                    case "remove":
                        return moderation.selfroles.removeButton(interaction);
                }
                break;
            case "message":
                switch (options.getSubcommand()) {
                    case "add":
                        return moderation.selfroles.addMessage(interaction);
                    case "remove":
                        return moderation.selfroles.removeMessage(interaction);
                    case "edit":
                        return moderation.selfroles.editMessage(interaction);
                }
        }
    }
}
