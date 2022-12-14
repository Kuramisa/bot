import { Command } from "@sapphire/framework";
import {
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ComponentType,
} from "discord.js";

export class GameCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "game",
            description: "Setup Game channels, join to create or more",
            requiredClientPermissions: "ManageChannels",
            requiredUserPermissions: "ManageChannels",
            preconditions: ["PremiumOnly"],
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(1 << 5)
                .addSubcommand((command) =>
                    command
                        .setName("setup")
                        .setDescription(
                            "Setup everything for a game automatically"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("game_to_use")
                                .setDescription("Which game to setup for?")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("remove")
                        .setDescription(
                            "Remove a game from your server (Make sure it was setup with this bot)"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("game_to_use")
                                .setDescription("Which game to remove?")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("jtc")
                        .setDescription("Join to create Control System")
                        .addSubcommand((command) =>
                            command
                                .setName("add_jtc")
                                .setDescription("Add JTC type (Maximum 5)")
                                .addStringOption((option) =>
                                    option
                                        .setName("game_to_use")
                                        .setDescription("Which game add to?")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("jtc_type")
                                        .setDescription(
                                            "What kind of type you want to add?"
                                        )
                                        .setRequired(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("remove_jtc")
                                .setDescription("Remove JTC type")
                                .addStringOption((option) =>
                                    option
                                        .setName("game_to_use")
                                        .setDescription(
                                            "Which game to remove from?"
                                        )
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("type_to_remove")
                                        .setDescription(
                                            "What kind of type you want to remove?"
                                        )
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("reset_jtc")
                                .setDescription("Reset JTC types")
                                .addStringOption((option) =>
                                    option
                                        .setName("game_to_use")
                                        .setDescription(
                                            "Which game to reset it for?"
                                        )
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("reset")
                        .setDescription(
                            "Reset database for a game (USE THIS ONLY IF NEEDED)"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("game_to_use")
                                .setDescription("Which game to reset?")
                                .setAutocomplete(true)
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

        const { database, games, util } = this.container;
        const { options, guild, channel } = interaction;

        if (!channel) return;
        const db = await database.guilds.get(guild);

        const gameToUse = options.getString("game_to_use", true);
        const jtc = options.getBoolean("jtc") || false;

        const forObj = gameToUse.toLowerCase();

        if (!db.games.list.map((list) => list.toLowerCase()).includes(forObj))
            return interaction.reply({
                content: "Game is not supported currently",
                ephemeral: true,
            });

        switch (options.getSubcommand()) {
            case "setup": {
                if (
                    db.games.settings[forObj] &&
                    db.games.settings[forObj].category !== null
                )
                    return interaction.reply({
                        content: `You already have set up ${gameToUse}. To reset it use </game reset:1035351423631773726>\n**ONLY USE IF NEEDED SINCE IT RESETS SETTINGS IN THE DATABASE AND NOT ON YOUR SERVER**`,
                        ephemeral: true,
                    });

                db.games.settings[forObj] = {
                    category: null,
                    channels: {},
                    types: ["unranked", "competitive", "custom"],
                    jtc: {
                        enabled: jtc,
                        channel: null,
                    },
                };

                const embed = util.embed().setTitle(`Setting up ${gameToUse}`);

                const message = await interaction.reply({
                    embeds: [embed],
                    fetchReply: true,
                });

                const category = await guild.channels.create({
                    name: gameToUse,
                    type: ChannelType.GuildCategory,
                });

                db.games.settings[forObj].category = category.id;

                embed.setDescription("??? Category created");

                await message.edit({ embeds: [embed] });

                const textChannel = await guild.channels.create({
                    name: `${gameToUse}-chat`,
                    parent: category,
                    type: ChannelType.GuildText,
                });

                db.games.settings[forObj].channels.chat = textChannel.id;

                embed.setDescription(
                    embed.toJSON().description + `\n??? ${textChannel} created`
                );

                await message.edit({ embeds: [embed] });

                const row = util
                    .row()
                    .setComponents(
                        util
                            .button()
                            .setCustomId("predefined_channels")
                            .setLabel("Predefined")
                            .setStyle(ButtonStyle.Success),
                        util
                            .button()
                            .setCustomId("jtc_channel")
                            .setLabel("Join to Create")
                            .setStyle(ButtonStyle.Primary)
                    );

                const differentEmbed = util
                    .embed()
                    .setDescription(
                        embed.toJSON().description +
                            "What kind of Channel/s do you want?"
                    );

                await message.edit({
                    embeds: [differentEmbed],
                    components: [row],
                });

                const buttonClick = await message.awaitMessageComponent({
                    componentType: ComponentType.Button,
                    filter: (i) =>
                        (i.customId === "predefined_channels" ||
                            i.customId === "jtc_channel") &&
                        i.user.id === interaction.user.id,
                });

                if (buttonClick.customId === "jtc_channel") {
                    const jtcChannel = await guild.channels.create({
                        name: "Join to Create",
                        type: ChannelType.GuildVoice,
                        parent: category,
                    });

                    db.games.settings[forObj].jtc.enabled = true;
                    db.games.settings[forObj].jtc.channel = jtcChannel.id;

                    embed.setDescription(
                        embed.toJSON().description +
                            `\n??? ${jtcChannel} created`
                    );

                    await message.edit({ embeds: [embed], components: [] });

                    buttonClick.deferUpdate();

                    db.markModified("games");
                    await db.save();
                } else {
                    const modal = games.getChannelModals(gameToUse);

                    await buttonClick.showModal(modal);

                    const mInteraction = await buttonClick.awaitModalSubmit({
                        filter: (i) => i.customId === "channel_amounts",
                        time: 0,
                    });

                    let fields = mInteraction.fields as any;
                    fields = fields._fields;
                    if (
                        fields.some((field: any) =>
                            isNaN(parseInt(field.value))
                        )
                    )
                        return mInteraction.reply({
                            content: "Please provide numbers for the channels",
                            ephemeral: true,
                        });

                    if (fields.some((field: any) => parseInt(field.value) > 5))
                        return mInteraction.reply({
                            content: "Maximum number of channels is 5",
                            ephemeral: true,
                        });

                    embed.setDescription(
                        embed.toJSON().description + "\n\n**Voice Channels**\n"
                    );

                    await message.edit({ embeds: [embed], components: [] });
                    await mInteraction.deferUpdate();

                    for (let i = 0; i < fields.length; i++) {
                        const field = fields[i];
                        const channelName = field.customId.split("_")[0];
                        for (let j = 1; j <= parseInt(field.value); j++) {
                            const channel = await guild.channels.create({
                                name: `${util.capFirstLetter(
                                    channelName
                                )} #${j}`,
                                parent: category,
                                type: ChannelType.GuildVoice,
                            });

                            db.games.settings[forObj].channels[
                                channelName + j
                            ] = channel.id;

                            embed.setDescription(
                                embed.toJSON().description +
                                    `??? ${channel} created\n`
                            );

                            if (message)
                                await message.edit({ embeds: [embed] });
                            else
                                await mInteraction.editReply({
                                    embeds: [embed],
                                });
                        }

                        embed.setDescription(`${embed.toJSON().description}\n`);
                    }

                    embed.setTitle(`${gameToUse} Setup has finished`);

                    if (message) await message.edit({ embeds: [embed] });
                    else
                        await mInteraction.editReply({
                            embeds: [embed],
                        });

                    db.markModified("games");
                    await db.save();
                }
                return;
            }
            case "remove": {
                const gameSettings = db.games.settings[forObj];
                if (!gameSettings.category)
                    return interaction.reply({
                        content: `${gameToUse} is not setup with this bot or for the server yet`,
                        ephemeral: true,
                    });

                const category = guild.channels.cache.get(
                    gameSettings.category
                );

                if (!category)
                    return interaction.reply({
                        content: `${gameToUse} Category not found on the server`,
                        ephemeral: true,
                    });

                await interaction.deferReply({ ephemeral: true });

                if (category.type !== ChannelType.GuildCategory) return;

                const channels = category.children.cache.toJSON();

                for (let i = 0; i < channels.length; i++) {
                    const channel = channels[i];
                    await channel.delete();
                }

                await category.delete();

                db.games.settings[forObj] = {
                    category: null,
                    channels: {},
                    types: [],
                    jtc: {
                        enabled: false,
                        channel: null,
                    },
                };

                await interaction.editReply({
                    content: `Deleted **${gameToUse}** from your server`,
                });

                db.markModified("games");
                await db.save();
                return;
            }
            case "reset": {
                db.games.settings[forObj] = {
                    category: null,
                    channels: {},
                    types: [],
                    jtc: {
                        enabled: false,
                        channel: null,
                    },
                };

                await interaction.reply({
                    content: `**${gameToUse}** Database was reset`,
                    ephemeral: true,
                });

                db.markModified("games");
                await db.save();
                return;
            }
        }

        switch (options.getSubcommandGroup()) {
            case "jtc": {
                switch (options.getSubcommand()) {
                    case "add_jtc": {
                        if (
                            !db.games.settings[forObj] ||
                            !db.games.settings[forObj].category
                        )
                            return interaction.reply({
                                content: `${gameToUse} is not setup with this bot or for the server yet`,
                                ephemeral: true,
                            });

                        if (db.games.settings[forObj].types.length === 5)
                            return interaction.reply({
                                content:
                                    "You already hit the maximum types of 5",
                                ephemeral: true,
                            });

                        let jtcType = options
                            .getString("jtc_type", true)
                            .toLowerCase();
                        if (jtcType.includes(" "))
                            jtcType = jtcType.split(" ").join("_");

                        if (db.games.settings[forObj].types.includes(jtcType))
                            return interaction.reply({
                                content: `**${jtcType}** already exists`,
                                ephemeral: true,
                            });

                        db.games.settings[forObj].types.push(jtcType);

                        db.markModified("games");
                        await db.save();

                        await interaction.reply({
                            content: `Added **${util.capFirstLetter(
                                jtcType
                            )}** as a new Join to Create Channel type`,
                            ephemeral: true,
                        });
                        return;
                    }
                    case "remove_jtc": {
                        if (
                            !db.games.settings[forObj] ||
                            !db.games.settings[forObj].category
                        )
                            return interaction.reply({
                                content: `${gameToUse} is not setup with this bot or for the server yet`,
                                ephemeral: true,
                            });

                        let typeToRemove = options
                            .getString("type_to_remove", true)
                            .toLowerCase();

                        if (typeToRemove.includes(" "))
                            typeToRemove = typeToRemove.split(" ").join("_");

                        if (
                            !db.games.settings[forObj].types.includes(
                                typeToRemove
                            )
                        )
                            return interaction.reply({
                                content: `**${typeToRemove}** doesn't exist`,
                                ephemeral: true,
                            });

                        db.games.settings[forObj].types = db.games.settings[
                            forObj
                        ].types.filter((type) => type !== typeToRemove);

                        db.markModified("games");
                        await db.save();

                        await interaction.reply({
                            content: `Removed **${util.capFirstLetter(
                                typeToRemove
                            )}** from Join to Create Channel types`,
                            ephemeral: true,
                        });
                        return;
                    }
                    case "reset_jtc": {
                        if (
                            !db.games.settings[forObj] ||
                            !db.games.settings[forObj].category
                        )
                            return interaction.reply({
                                content: `${gameToUse} is not setup with this bot or for the server yet`,
                                ephemeral: true,
                            });

                        db.games.settings[forObj].types = [];

                        db.markModified("games");
                        await db.save();
                        await interaction.reply({
                            content: `${gameToUse} JTC types was reset`,
                            ephemeral: true,
                        });
                        return;
                    }
                }
                return;
            }
        }
    }
}
