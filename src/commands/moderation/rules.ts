import { Subcommand } from "@sapphire/plugin-subcommands";
import { ChatInputCommandInteraction, TextInputStyle } from "discord.js";

export class RulesCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "rules",
            description: "Set/Check/Edit Rules",
            requiredUserPermissions: "ManageGuild",
        });
    }

    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(1 << 5)
                .addSubcommand((command) =>
                    command.setName("set").setDescription("Set rules")
                )
                .addSubcommand((command) =>
                    command
                        .setName("check")
                        .setDescription("Check current rules")
                )
                .addSubcommand((command) =>
                    command.setName("edit").setDescription("Edit current rules")
                )
        );
    }

    async chatInputRun(
        interaction: ChatInputCommandInteraction<"cached">
    ): Promise<any> {
        const { database, util } = this.container;

        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const channel =
            guild.channels.cache.get(db.channels.rules) || guild.rulesChannel;

        if (!channel)
            return interaction.reply({
                content:
                    "Set your Rules channel through community settings or with `/settings`",
                ephemeral: true,
            });

        if (!channel.isTextBased())
            return interaction.reply({
                content: "Make sure your rules channel is text based",
                ephemeral: true,
            });

        const messages = await channel.messages.fetch();

        if (messages.some((message) => !message.author.bot))
            return interaction.reply({
                content:
                    "Make sure there are no user messages and the channel is solely used for rules",
                ephemeral: true,
            });

        switch (options.getSubcommand()) {
            case "set": {
                if (messages.size > 0)
                    return interaction.reply({
                        content:
                            "Rules already exist, use `/rules update` or `/rules delete` and make a new one",
                        ephemeral: true,
                    });

                const modal = util
                    .modal()
                    .setCustomId("rules_create")
                    .setTitle("Creating Rules")
                    .addComponents(
                        util
                            .modalRow()
                            .setComponents(
                                util
                                    .input()
                                    .setCustomId("rules_input_create")
                                    .setLabel("New Rules")
                                    .setStyle(TextInputStyle.Paragraph)
                            )
                    );

                return interaction.showModal(modal);
            }
            case "edit": {
                if (messages.size !== 1)
                    return interaction.reply({
                        content:
                            "To edit the rules there should be only one message that contains rules by the bot",
                        ephemeral: true,
                    });

                const message = messages.first();
                if (!message)
                    return interaction.reply({
                        content: "Could not find the rules message",
                        ephemeral: true,
                    });

                const modal = util
                    .modal()
                    .setCustomId("rules_edit")
                    .setTitle("Editing Current Rules")
                    .addComponents(
                        util
                            .modalRow()
                            .setComponents(
                                util
                                    .input()
                                    .setCustomId("rules_input_edit")
                                    .setLabel("Current Rules")
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setValue(message.content)
                            )
                    );

                return interaction.showModal(modal);
            }
            case "check": {
                if (messages.size !== 1)
                    return interaction.reply({
                        content:
                            "To check the rules there should be only one message that contains rules by the bot",
                        ephemeral: true,
                    });

                const message = messages.first();

                if (!message)
                    return interaction.reply({
                        content: "No message found",
                        ephemeral: true,
                    });

                return interaction.reply({
                    content: message.content,
                    ephemeral: true,
                });
            }
        }
    }
}
