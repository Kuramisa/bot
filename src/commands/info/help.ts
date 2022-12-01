import { Args } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { ChatInputCommandInteraction, Message } from "discord.js";

export class HelpCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "help",
            description: "View commands and what they do",
            aliases: ["?"],
            subcommands: [
                {
                    name: "all",
                    messageRun: "messageAll",
                    chatInputRun: "chatInputAll"
                },
                {
                    name: "category",
                    messageRun: "messageCategory",
                    chatInputRun: "chatInputCategory"
                },
                {
                    name: "command",
                    messageRun: "messageCommand",
                    chatInputRun: "chatInputCommand"
                }
            ]
        });
    }

    /**
     * Register Slash Command
     */
    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((command) =>
                    command
                        .setName("all")
                        .setDescription("Look at all commands")
                )
                .addSubcommand((command) =>
                    command
                        .setName("category")
                        .setDescription("View certain category")
                        .addStringOption((option) =>
                            option
                                .setName("category")
                                .setDescription("Category to view")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("command")
                        .setDescription("View certain commands")
                        .addStringOption((option) =>
                            option
                                .setName("command")
                                .setDescription("Command to view")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
        );
    }

    /**
     * Execute Message Subcommand (All)
     */
    async messageAll(message: Message) {
        const { client, util, stores } = this.container;

        const categories = stores.get("commands").categories;

        const description = categories
            .sort((a, b) => a.localeCompare(b))
            .map((category) => {
                const commands = stores
                    .get("commands")
                    .filter((command) => command.fullCategory[0] === category)
                    .map(
                        (command) =>
                            `**${command.name}** - \`${command.description}\``
                    );

                return `${util.capFirstLetter(category)}\n${commands.join(
                    "\n"
                )}`;
            })
            .join("\n\n");

        const embed = util
            .embed()
            .setTitle(`${client.user?.username} Help`)
            .setThumbnail(
                client.user?.displayAvatarURL({ extension: "gif" }) as string
            )
            .setDescription(description);

        return message.reply({ embeds: [embed] });
    }

    /**
     * Execute Slash Subcommand (All)
     */
    async chatInputAll(interaction: ChatInputCommandInteraction) {
        const { client, util, stores } = this.container;

        const categories = stores.get("commands").categories;

        const description = categories
            .sort((a, b) => a.localeCompare(b))
            .map((category) => {
                const commands = stores
                    .get("commands")
                    .filter((command) => command.fullCategory[0] === category)
                    .map(
                        (command) =>
                            `**${command.name}** - \`${command.description}\``
                    );

                return `${util.capFirstLetter(category)}\n${commands.join(
                    "\n"
                )}`;
            })
            .join("\n\n");

        const embed = util
            .embed()
            .setTitle(`${client.user?.username} Help`)
            .setThumbnail(
                client.user?.displayAvatarURL({ extension: "gif" }) as string
            )
            .setDescription(description);

        return interaction.reply({ embeds: [embed] });
    }

    /**
     * Execute Message Subcommand (Category)
     */
    async messageCategory(message: Message, args: Args) {
        const { client, util } = this.container;

        const category = await args.pick("category").catch(() => null);

        if (!category) return message.reply("Category not found");

        const commands = category
            .map(
                (command) => `**${command.name}** - \`${command.description}\``
            )
            .join("\n");

        const embed = util
            .embed()
            .setTitle(`${category.random()?.fullCategory[0]} Category`)
            .setThumbnail(client.user?.displayAvatarURL() as string)
            .setDescription(commands);

        return message.reply({ embeds: [embed] });
    }

    /**
     * Execute Slash Subcommand (Category)
     */
    async chatInputCategory(interaction: ChatInputCommandInteraction) {
        const { options } = interaction;
        const { client, util, stores } = this.container;

        const categoryId = options.getString("category", true);
        const category = stores
            .get("commands")
            .filter((command) => command.fullCategory[0] === categoryId);

        if (!category)
            return interaction.reply({
                content: "Category not found",
                ephemeral: true
            });

        const commands = category
            .map(
                (command) => `**${command.name}** - \`${command.description}\``
            )
            .join("\n");

        const embed = util
            .embed()
            .setTitle(`${category.random()?.fullCategory[0]} Category`)
            .setThumbnail(client.user?.displayAvatarURL() as string)
            .setDescription(commands);

        return interaction.reply({ embeds: [embed] });
    }

    /**
     * Execute Message Subcommand (Command)
     */
    async messageCommand(message: Message, args: Args) {
        const { util } = this.container;

        const command = await args.pick("command").catch(() => null);

        if (!command) return message.reply("Command not found");

        const embed = util
            .embed()
            .setTitle(`${command.name} Command`)
            .setFields(
                {
                    name: "Category",
                    value: `${util.capFirstLetter(command.fullCategory[0])}`,
                    inline: true
                },
                {
                    name: "Disabled",
                    value: command.enabled ? "Yes" : "No",
                    inline: true
                }
            );

        return message.reply({ embeds: [embed] });
    }

    /**
     * Execute Slash Subcommand (Command)
     */
    async chatInputCommand(interaction: ChatInputCommandInteraction) {
        const { util, stores } = this.container;
        const { options } = interaction;

        const commandName = options.getString("command", true);
        const command = stores.get("commands").get(commandName);

        if (!command)
            return interaction.reply({
                content: "Command not found",
                ephemeral: true
            });

        const embed = util
            .embed()
            .setTitle(`${command.name} Command`)
            .setFields(
                {
                    name: "Category",
                    value: `${util.capFirstLetter(command.fullCategory[0])}`,
                    inline: true
                },
                {
                    name: "Enabled",
                    value: command.enabled ? "Yes" : "No",
                    inline: true
                }
            );

        return interaction.reply({ embeds: [embed] });
    }
}
