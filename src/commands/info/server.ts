import { Command } from "@sapphire/framework";
import { Guild } from "discord.js";
import { Message } from "discord.js";

export class ServerCommand extends Command {
    public constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "server",
            aliases: ["guild"],
            description: "Server Info",
            runIn: "GUILD_ANY"
        });
    }

    /**
     * Register Slash Command
     */
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
        );
    }

    /**
     * Execute Message Command
     */
    public messageRun = async (message: Message<true>) =>
        message.reply({ embeds: [this.generateEmbed(message.guild)] });

    /**
     * Execute Slash Command
     */
    public chatInputRun = (
        interaction: Command.ChatInputInteraction<"cached">
    ) =>
        interaction.reply({
            embeds: [this.generateEmbed(interaction.guild)],
            ephemeral: true
        });

    /**
     * Create Embed for Server Info
     */
    private generateEmbed(guild: Guild) {
        const { util } = this.container;

        const {
            createdTimestamp,
            description,
            features,
            members,
            memberCount,
            channels,
            emojis,
            stickers
        } = guild;

        const icon = guild.iconURL({ dynamic: true }) as string;

        return util
            .embed()
            .setAuthor({ name: guild.name, iconURL: icon as string })
            .setThumbnail(icon)
            .addFields([
                {
                    name: "General",
                    value: `
                            Name: ${guild.name}
                            Created: <t:${Math.floor(
                                createdTimestamp / 1000
                            )}:R>
                            Owner: ${guild.members.cache.get(guild.ownerId)}

                            Description: ${description}

                            Features: ${features
                                .map((feature) =>
                                    feature
                                        .toLowerCase()
                                        .split("_")
                                        .map(
                                            (word) =>
                                                `**${util.capFirstLetter(
                                                    word
                                                )}**`
                                        )
                                        .join(" ")
                                )
                                .join(", ")}
                        `
                },
                {
                    name: "👥| Users",
                    value: `
                            - Members: ${
                                members.cache.filter((m) => !m.user.bot).size
                            }
                            - Bots: ${
                                members.cache.filter((m) => m.user.bot).size
                            }
                        
                            Total: ${memberCount}
                        `
                },
                {
                    name: "📃 | Channels",
                    value: `
                            - Text: ${
                                channels.cache.filter(
                                    (ch) => ch.type == "GUILD_TEXT"
                                ).size
                            }
                            - Voice: ${
                                channels.cache.filter(
                                    (ch) => ch.type == "GUILD_VOICE"
                                ).size
                            }
                            - Threads: ${
                                channels.cache.filter(
                                    (ch) =>
                                        ch.type === "GUILD_NEWS_THREAD" ||
                                        ch.type === "GUILD_PUBLIC_THREAD" ||
                                        ch.type === "GUILD_PRIVATE_THREAD"
                                ).size
                            }
                            - Categories: ${
                                channels.cache.filter(
                                    (ch) => ch.type == "GUILD_CATEGORY"
                                ).size
                            }
                            - Stages: ${
                                channels.cache.filter(
                                    (ch) => ch.type == "GUILD_STAGE_VOICE"
                                ).size
                            }
                            - News: ${
                                channels.cache.filter(
                                    (ch) => ch.type == "GUILD_NEWS"
                                ).size
                            }

                            Total: ${channels.cache.size}
                        `
                },
                {
                    name: "😯 | Emojis & Stickers",
                    value: `
                            - Animated: ${
                                emojis.cache.filter((e) => e.animated == true)
                                    .size
                            }
                            - Static: ${
                                emojis.cache.filter((e) => !e.animated).size
                            }
                            - Stickers: ${stickers.cache.size}

                            Total: ${emojis.cache.size + stickers.cache.size}
                        `
                },
                {
                    name: "Nitro Statistics",
                    value: `
                            - Tier: ${guild.premiumTier}
                            - Boosts: ${guild.premiumSubscriptionCount}
                            - Boosters: ${
                                members.cache.filter(
                                    (m) => m.premiumSince !== null
                                ).size
                            }
                        `
                }
            ]);
    }
}