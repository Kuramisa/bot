import { Subcommand } from "@sapphire/plugin-subcommands";
import { ButtonStyle, ChatInputCommandInteraction } from "discord.js";

export class TicketsCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "tickets",
            description: "Ticket System",
            requiredUserPermissions: "ManageGuild",
        });
    }

    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(1 << 5)
                .addSubcommand((command) =>
                    command
                        .setName("auto")
                        .setDescription("Automatic setup for ticket system")
                )
                .addSubcommand((command) =>
                    command
                        .setName("description")
                        .setDescription(
                            "Set a description for the message in ticket system"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("desc")
                                .setDescription(
                                    "Description for the ticket system"
                                )
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("category")
                        .setDescription("Category for your ticket system")
                        .addChannelOption((option) =>
                            option
                                .setName("category_channel")
                                .setDescription("Category to set it to")
                                .setRequired(true)
                                .addChannelTypes(4)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("channels")
                        .setDescription("Channels for your ticket system")
                        .addStringOption((option) =>
                            option
                                .setName("channel_type")
                                .setDescription("Channel type")
                                .setRequired(true)
                                .addChoices(
                                    {
                                        name: "Open Ticket",
                                        value: "openTicket",
                                    },
                                    {
                                        name: "Transcripts",
                                        value: "transcripts",
                                    }
                                )
                        )
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("Channel to set it to")
                                .setRequired(true)
                                .addChannelTypes(0)
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("buttons")
                        .setDescription("Set up buttons for the ticketing")
                        .addSubcommand((command) =>
                            command
                                .setName("add")
                                .setDescription("Add a button")
                                .addStringOption((option) =>
                                    option
                                        .setName("text")
                                        .setDescription("Text for the button")
                                        .setRequired(true)
                                )
                                .addNumberOption((option) =>
                                    option
                                        .setName("style")
                                        .setDescription("Style for the button")
                                        .setRequired(true)
                                        .addChoices(
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
                                        .setName("emoji")
                                        .setDescription("Emoji for the button")
                                        .setRequired(false)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("remove")
                                .setDescription("Remove a button")
                                .addStringOption((option) =>
                                    option
                                        .setName("id")
                                        .setDescription("Button name to remove")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("reset")
                                .setDescription("Reset all the buttons")
                        )
                )
        );
    }

    async chatInputRun(
        interaction: ChatInputCommandInteraction<"cached">
    ): Promise<any> {
        const {
            database,
            moderation: { tickets },
        } = this.container;

        const { options, guild } = interaction;

        switch (interaction.options.getSubcommand()) {
            case "auto": {
                await tickets.autoSetup(interaction);
                break;
            }
            case "description": {
                await tickets.editDescription(interaction);
                break;
            }
            case "add": {
                await tickets.addButton(interaction);
                break;
            }
            case "remove": {
                await tickets.removeButton(interaction);
                break;
            }
            case "reset": {
                await tickets.resetButtons(interaction);
                break;
            }
            case "channels": {
                const db = await database.guilds.get(guild);
                if (!db) return;

                const type = options.getString("channel_type", true);
                const channel = options.getChannel("channel", true);

                db.tickets.channels[type as keyof typeof db.tickets.channels] =
                    channel.id;

                await db.save();

                return interaction.reply({
                    content: `Channel type was set to ${channel}`,
                    ephemeral: true,
                });
            }
            case "category": {
                const db = await database.guilds.get(guild);
                if (!db) return;

                const category = options.getChannel("category_channel", true);

                db.tickets.category = category.id;

                await db.save();

                return interaction.reply({
                    content: `Ticket category set to \`${category.name}\``,
                    ephemeral: true,
                });
            }
        }
    }
}
