import { Command } from "@sapphire/framework";
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    Message,
} from "discord.js";

export class PremiumInfoCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "premium",
            aliases: ["exclusive"],
            description: "Information about Premium and it's features",
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((command) =>
                    command
                        .setName("info")
                        .setDescription(
                            "Information about Premium subscription"
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("give")
                        .setDescription("Give Guild/User Premium")
                        .addSubcommand((command) =>
                            command
                                .setName("guild")
                                .setDescription(
                                    "Give a Server Premium Subscription to a server"
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("server")
                                        .setDescription("Server to give it to")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("user")
                                .setDescription(
                                    "Give a User Premium Subscription to a User"
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("user")
                                        .setDescription("Server to give it to")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("take")
                        .setDescription("Take away Guild/User Premium")
                        .addSubcommand((command) =>
                            command
                                .setName("guild")
                                .setDescription(
                                    "Take away a Server Premium Subscription from a server"
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("server")
                                        .setDescription("Server to give it to")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("user")
                                .setDescription(
                                    "Take away a User Premium Subscription from a User"
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("user")
                                        .setDescription("Server to give it to")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("refresh")
                        .setDescription(
                            "Refresh status of premium subscriptions"
                        )
                )
        );
    }

    /**
     * Execute Message Command
     */
    async messageRun(message: Message) {
        const { client, util } = this.container;

        const info = util
            .embed()
            .setTitle(`${client.user?.username} - Premium Information`)
            .setDescription(
                "Premium comes with more commands, more perks, beta testing for the bot and many other features that you can have a preview of"
            );

        const commands = util
            .embed()
            .setTitle(`${client.user?.username} - Premium Commands`)
            .setDescription(this.getPremiumCommands());

        const prices = util
            .embed()
            .setTitle(`${client.user?.username} - Premium Prices`)
            .setDescription(
                "**Per Server**: *$9.99* ***Recommended***\n**Per User**: *$4.99*\n***These prices may change in the future, there will be a notice to all premium users if that happens***"
            );

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("prices_page")
                    .setLabel("Prices")
                    .setStyle(ButtonStyle.Danger),
                util
                    .button()
                    .setCustomId("info_page")
                    .setLabel("Info")
                    .setStyle(ButtonStyle.Secondary),
                util
                    .button()
                    .setCustomId("commands_page")
                    .setLabel("Commands")
                    .setStyle(ButtonStyle.Success)
            );

        let currentEmbed = [info];

        const msg = await message.reply({
            embeds: currentEmbed,
            components: [row],
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) =>
                (i.customId === "info_page" ||
                    i.customId === "prices_page" ||
                    i.customId === "commands_page") &&
                i.user.id === message.author.id,
            time: 30000,
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "info_page":
                        currentEmbed = [info];
                        break;
                    case "prices_page":
                        currentEmbed = [prices];
                        break;
                    case "commands_page":
                        currentEmbed = [commands];
                        break;
                }

                await i.deferUpdate();
                await i.editReply({ embeds: currentEmbed });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete") msg.delete();
            });
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { options, user: executor } = interaction;
        const {
            client,
            database,
            systems: { bmc },
            owners,
            util,
        } = this.container;

        switch (options.getSubcommand()) {
            case "info": {
                const info = util
                    .embed()
                    .setAuthor({
                        name: `${client.user?.username} - Premium Information`,
                    })
                    .setDescription(
                        "Premium comes with more commands, more perks, beta testing for the bot and many other features that you can have a preview of"
                    );

                const commands = util
                    .embed()
                    .setAuthor({
                        name: `${client.user?.username} - Premium Commands`,
                    })
                    .setDescription(this.getPremiumCommands());

                const prices = util
                    .embed()
                    .setAuthor({
                        name: `${client.user?.username} - Premium Prices`,
                    })
                    .setDescription(
                        "**Per Server**: *$10* ***Recommended***\n**Per User**: *$5*\n\n***These prices may change in the future, there will be a notice to all premium users if that happens***"
                    );

                const row = util
                    .row()
                    .setComponents(
                        util
                            .button()
                            .setCustomId("prices_page")
                            .setLabel("Prices")
                            .setStyle(ButtonStyle.Danger),
                        util
                            .button()
                            .setCustomId("info_page")
                            .setLabel("Info")
                            .setStyle(ButtonStyle.Secondary),
                        util
                            .button()
                            .setCustomId("commands_page")
                            .setLabel("Commands")
                            .setStyle(ButtonStyle.Success)
                    );

                let currentEmbed = [info];

                const msg = await interaction.reply({
                    embeds: currentEmbed,
                    components: [row],
                    fetchReply: true,
                });

                const collector = msg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    filter: (i) =>
                        (i.customId === "info_page" ||
                            i.customId === "prices_page" ||
                            i.customId === "commands_page") &&
                        i.user.id === interaction.user.id,
                    time: 30000,
                });

                collector
                    .on("collect", async (i) => {
                        switch (i.customId) {
                            case "info_page":
                                currentEmbed = [info];
                                break;
                            case "prices_page":
                                currentEmbed = [prices];
                                break;
                            case "commands_page":
                                currentEmbed = [commands];
                                break;
                        }

                        await i.deferUpdate();
                        await i.editReply({ embeds: currentEmbed });

                        collector.resetTimer();
                    })
                    .on("end", (_, reason) => {
                        if (reason !== "messageDelete") msg.delete();
                    });
                break;
            }
            case "refresh": {
                if (!owners.includes(executor.id))
                    return interaction.reply({
                        content: "This command is owner only",
                        ephemeral: true,
                    });

                await bmc.premium.checkServers();
                await bmc.premium.checkUsers();

                return interaction.reply({
                    content: "Subscriptions refreshed",
                    ephemeral: true,
                });
            }
            case "guild": {
                if (!owners.includes(executor.id))
                    return interaction.reply({
                        content: "This command is owner only",
                        ephemeral: true,
                    });

                const guild = await client.guilds.fetch(
                    options.getString("server", true)
                );
                if (!guild)
                    return interaction.reply({
                        content: "Server not found",
                        ephemeral: true,
                    });
                const db = await database.guilds.get(guild);
                switch (options.getSubcommandGroup()) {
                    case "give": {
                        if (db.premium === true)
                            return interaction.reply({
                                content: `${guild} already has premium`,
                                ephemeral: true,
                            });
                        db.premium = true;
                        await db.save();
                        return interaction.reply({
                            content: `Gave ${guild} a Premium Subscription`,
                            ephemeral: true,
                        });
                    }
                    case "take": {
                        if (!db.premium)
                            return interaction.reply({
                                content: `${guild} does not have premium`,
                                ephemeral: true,
                            });
                        db.premium = false;
                        await db.save();
                        return interaction.reply({
                            content: `Took Premium Subscription from ${guild}`,
                            ephemeral: true,
                        });
                    }
                }
                break;
            }
            case "user": {
                if (!owners.includes(executor.id))
                    return interaction.reply({
                        content: "This command is owner only",
                        ephemeral: true,
                    });

                const user = await client.users.fetch(
                    options.getString("user", true)
                );
                if (!user)
                    return interaction.reply({
                        content: "User not found",
                        ephemeral: true,
                    });
                const db = await database.users.get(user);
                switch (options.getSubcommandGroup()) {
                    case "give": {
                        if (db.premium === true)
                            return interaction.reply({
                                content: `${user} already has premium`,
                                ephemeral: true,
                            });
                        db.premium = true;
                        await db.save();
                        return interaction.reply({
                            content: `Gave ${user} a Premium Subscription`,
                            ephemeral: true,
                        });
                    }
                    case "take": {
                        if (!db.premium)
                            return interaction.reply({
                                content: `${user} does not have premium`,
                                ephemeral: true,
                            });
                        db.premium = false;
                        await db.save();
                        return interaction.reply({
                            content: `Took Premium Subscription from ${user}`,
                            ephemeral: true,
                        });
                    }
                }
                break;
            }
        }
    }

    private getPremiumCommands() {
        const commands = this.container.stores
            .get("commands")
            .filter((command) =>
                command.preconditions.entries.some(
                    (pre: any) => pre.name === "PremiumOnly"
                )
            );

        return commands
            .map((command) => `**${command.name}** - *${command.description}*`)
            .join("\n");
    }
}
