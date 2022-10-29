import { Command } from "@sapphire/framework";
import { BREAK } from "graphql";

export class GameCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "game",
            description: "Setup Game channels, join to create or more",
            requiredClientPermissions: ["MANAGE_CHANNELS"],
            requiredUserPermissions: ["MANAGE_CHANNELS"],
            preconditions: ["PremiumOnly"]
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
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
                                .setName("game_to_setup")
                                .setDescription("Which game to setup for?")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName("jtc")
                                .setDescription(
                                    "Do you want to setup Join to create?"
                                )
                                .setRequired(false)
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
                                .setName("game_to_remove")
                                .setDescription("Which game to remove?")
                                .setAutocomplete(true)
                                .setRequired(true)
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
                                .setName("game_to_reset")
                                .setDescription("Which game to reset?")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
        );
    }

    public async chatInputRun(
        interaction: Command.ChatInputInteraction<"cached">
    ) {
        const { database, util } = this.container;
        const { options, guild, channel } = interaction;

        if (!channel) return;
        const db = await database.guilds.get(guild);
        if (!db) return;

        switch (options.getSubcommand()) {
            case "setup": {
                const gameToSetup = options.getString("game_to_setup", true);
                const jtc = options.getBoolean("jtc") || false;

                const forObj = gameToSetup.toLowerCase();

                if (!db.games.list.includes(gameToSetup))
                    return interaction.reply({
                        content: "Game is not supported currently",
                        ephemeral: true
                    });

                if (db.games.settings[forObj].category !== null)
                    return interaction.reply({
                        content: `You already have set up ${gameToSetup}. To reset it use </game reset:1035351423631773726>\n**ONLY USE IF NEEDED SINCE IT RESETS SETTINGS IN THE DATABASE AND NOT ON YOUR SERVER**`,
                        ephemeral: true
                    });

                db.games.settings[forObj] = {
                    category: null,
                    channels: {},
                    jtc: {
                        enabled: jtc,
                        channel: null
                    }
                };

                const embed = util
                    .embed()
                    .setTitle(`Setting up ${gameToSetup}`);

                let message = null;

                if (jtc)
                    message = await interaction.reply({
                        embeds: [embed],
                        fetchReply: true
                    });

                const category = await guild.channels.create(gameToSetup, {
                    type: "GUILD_CATEGORY"
                });

                db.games.settings[forObj].category = category.id;

                embed.setDescription("✅ Category created");

                if (message) await message.edit({ embeds: [embed] });

                const textChannel = await guild.channels.create(
                    `${gameToSetup}-chat`,
                    { parent: category, type: "GUILD_TEXT" }
                );

                db.games.settings[forObj].channels.chat = textChannel.id;

                embed.setDescription(
                    embed.description + `\n✅ ${textChannel} created`
                );

                if (message) await message.edit({ embeds: [embed] });

                if (jtc) {
                    const jtcChannel = await guild.channels.create(
                        "Join to Create",
                        {
                            type: "GUILD_VOICE",
                            parent: category,
                            userLimit: 1
                        }
                    );

                    db.games.settings[forObj].jtc.channel = jtcChannel.id;

                    embed.setDescription(
                        embed.description + `\n✅ ${jtcChannel} created`
                    );

                    if (message) await message.edit({ embeds: [embed] });

                    db.markModified("games");
                    await db.save();
                } else {
                    switch (forObj) {
                        case "valorant": {
                            const modal = util
                                .modal()
                                .setCustomId("channel_amounts")
                                .setTitle(
                                    `Creating channels for ${gameToSetup}`
                                )
                                .setComponents(
                                    util
                                        .modalRow()
                                        .setComponents(
                                            util
                                                .input()
                                                .setCustomId("unrated_channels")
                                                .setLabel(
                                                    "How many Unrated channels? (Maximum 5)"
                                                )
                                                .setMinLength(1)
                                                .setMaxLength(1)
                                                .setPlaceholder(
                                                    "Provide a number"
                                                )
                                                .setStyle("SHORT")
                                        ),
                                    util
                                        .modalRow()
                                        .setComponents(
                                            util
                                                .input()
                                                .setCustomId(
                                                    "competitive_channels"
                                                )
                                                .setLabel(
                                                    "How many Competitive channels? (Maximum 5)"
                                                )
                                                .setMinLength(1)
                                                .setMaxLength(1)
                                                .setPlaceholder(
                                                    "Provide a number"
                                                )
                                                .setStyle("SHORT")
                                        ),
                                    util
                                        .modalRow()
                                        .setComponents(
                                            util
                                                .input()
                                                .setCustomId("custom_channels")
                                                .setLabel(
                                                    "How many Custom Game channels? (Maximum 5)"
                                                )
                                                .setMinLength(1)
                                                .setMaxLength(1)
                                                .setPlaceholder(
                                                    "Provide a number"
                                                )
                                                .setStyle("SHORT")
                                        )
                                );

                            await interaction.showModal(modal);

                            const mInteraction =
                                await interaction.awaitModalSubmit({
                                    time: 0
                                });

                            const unrankedAmount = parseInt(
                                mInteraction.fields.getTextInputValue(
                                    "unrated_channels"
                                )
                            );

                            const compAmount = parseInt(
                                mInteraction.fields.getTextInputValue(
                                    "competitive_channels"
                                )
                            );

                            const customAmount = parseInt(
                                mInteraction.fields.getTextInputValue(
                                    "custom_channels"
                                )
                            );

                            if (
                                isNaN(
                                    compAmount || unrankedAmount || customAmount
                                )
                            )
                                return mInteraction.reply({
                                    content:
                                        "Please provide numbers for the channels",
                                    ephemeral: true
                                });

                            if (
                                compAmount > 5 ||
                                unrankedAmount > 5 ||
                                customAmount > 5
                            )
                                return mInteraction.reply({
                                    content: "Maximum number of channels is 5",
                                    ephemeral: true
                                });

                            await mInteraction.reply({ embeds: [embed] });

                            embed.setDescription(
                                embed.description + "\n\n**Voice Channels**\n"
                            );

                            for (let i = 1; i <= unrankedAmount; i++) {
                                const channel = await guild.channels.create(
                                    `Unranked #${i}`,
                                    {
                                        parent: category,
                                        type: "GUILD_VOICE"
                                    }
                                );

                                db.games.settings[forObj].channels[
                                    `unranked${i}`
                                ] = channel.id;

                                embed.setDescription(
                                    embed.description +
                                        `✅ ${channel} created\n`
                                );
                                if (message)
                                    await message.edit({ embeds: [embed] });
                                else
                                    await mInteraction.editReply({
                                        embeds: [embed]
                                    });
                            }

                            embed.setDescription(`${embed.description}\n`);

                            for (let j = 1; j <= compAmount; j++) {
                                const channel = await guild.channels.create(
                                    `Ranked #${j}`,
                                    {
                                        parent: category,
                                        type: "GUILD_VOICE"
                                    }
                                );

                                db.games.settings[forObj].channels[
                                    `ranked${j}`
                                ] = channel.id;

                                embed.setDescription(
                                    embed.description +
                                        `✅ ${channel} created\n`
                                );

                                if (message)
                                    await message.edit({ embeds: [embed] });
                                else
                                    await mInteraction.editReply({
                                        embeds: [embed]
                                    });
                            }

                            embed.setDescription(`${embed.description}\n`);

                            for (let k = 1; k <= customAmount; k++) {
                                const channel = await guild.channels.create(
                                    `Custom #${k}`,
                                    {
                                        parent: category,
                                        type: "GUILD_VOICE"
                                    }
                                );

                                db.games.settings[forObj].channels[
                                    `custom${k}`
                                ] = channel.id;

                                embed.setDescription(
                                    embed.description +
                                        `✅ ${channel} created\n`
                                );

                                if (message)
                                    await message.edit({ embeds: [embed] });
                                else
                                    await mInteraction.editReply({
                                        embeds: [embed]
                                    });
                            }

                            embed.setTitle(`${gameToSetup} Setup has finished`);

                            if (message)
                                await message.edit({ embeds: [embed] });
                            else
                                await mInteraction.editReply({
                                    embeds: [embed]
                                });

                            db.markModified("games");
                            await db.save();
                            break;
                        }
                    }
                }
                break;
            }
            case "remove": {
                const gameToRemove = options.getString("game_to_remove", true);
                const forObj = gameToRemove.toLowerCase();

                if (!db.games.list.includes(gameToRemove))
                    return interaction.reply({
                        content: "Game is not supported currently",
                        ephemeral: true
                    });

                const gameSettings = db.games.settings[forObj];
                if (!gameSettings.category)
                    return interaction.reply({
                        content: `${gameToRemove} is not setup with this bot or for the server yet`,
                        ephemeral: true
                    });

                const category = guild.channels.cache.get(
                    gameSettings.category
                );

                if (!category)
                    return interaction.reply({
                        content: `${gameToRemove} Category not found on the server`,
                        ephemeral: true
                    });

                await interaction.deferReply({ ephemeral: true });

                if (category.type !== "GUILD_CATEGORY") return;

                const channels = category.children.toJSON();

                for (let i = 0; i < channels.length; i++) {
                    const channel = channels[i];
                    await channel.delete();
                }

                await category.delete();

                db.games.settings[forObj] = {
                    category: null,
                    channels: {},
                    jtc: {
                        enabled: false,
                        channel: null
                    }
                };

                await interaction.editReply({
                    content: `Deleted ${gameToRemove} from your server`
                });

                db.markModified("games");
                await db.save();
                break;
            }
            case "reset": {
                const gameToReset = options.getString("game_to_reset", true);
                const forObj = gameToReset.toLowerCase();

                if (!db.games.list.includes(gameToReset))
                    return interaction.reply({
                        content: "Game is not supported currently",
                        ephemeral: true
                    });

                db.games.settings[forObj] = {
                    category: null,
                    channels: {},
                    jtc: {
                        enabled: false,
                        channel: null
                    }
                };

                await interaction.reply({
                    content: `Database reset for ${gameToReset} is done`,
                    ephemeral: true
                });

                db.markModified("games");
                await db.save();
                break;
            }
        }
    }
}
