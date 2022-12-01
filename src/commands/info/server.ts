import { Command } from "@sapphire/framework";
import {
    ChannelType,
    ChatInputCommandInteraction,
    Guild,
    Message,
} from "discord.js";

export class ServerCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "server",
            aliases: ["guild"],
            description: "Server Info",
            runIn: "GUILD_ANY",
        });
    }

    /**
     * Register Slash Command
     */
    override registerApplicationCommands(registry: Command.Registry) {
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
    messageRun = async (message: Message<true>) =>
        message.reply({ embeds: [this.generateEmbed(message.guild)] });

    /**
     * Execute Slash Command
     */
    chatInputRun = (interaction: ChatInputCommandInteraction<"cached">) =>
        interaction.reply({
            embeds: [this.generateEmbed(interaction.guild)],
            ephemeral: true,
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
            stickers,
        } = guild;

        const icon = guild.iconURL({ extension: "gif" }) as string;

        return util
            .embed()
            .setAuthor({ name: guild.name, iconURL: icon })
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
                        `,
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
                        `,
                },
                {
                    name: "📃 | Channels",
                    value: `
                            - Text: ${
                                channels.cache.filter(
                                    (ch) => ch.type === ChannelType.GuildText
                                ).size
                            }
                            - Voice: ${
                                channels.cache.filter(
                                    (ch) => ch.type === ChannelType.GuildVoice
                                ).size
                            }
                            - Threads: ${
                                channels.cache.filter(
                                    (ch) =>
                                        ch.type ===
                                            ChannelType.AnnouncementThread ||
                                        ch.type === ChannelType.PublicThread ||
                                        ch.type === ChannelType.PrivateThread
                                ).size
                            }
                            - Categories: ${
                                channels.cache.filter(
                                    (ch) =>
                                        ch.type === ChannelType.GuildCategory
                                ).size
                            }
                            - Stages: ${
                                channels.cache.filter(
                                    (ch) =>
                                        ch.type === ChannelType.GuildStageVoice
                                ).size
                            }
                            - News: ${
                                channels.cache.filter(
                                    (ch) =>
                                        ch.type ===
                                        ChannelType.GuildAnnouncement
                                ).size
                            }

                            Total: ${channels.cache.size}
                        `,
                },
                {
                    name: "😯 | Emojis & Stickers",
                    value: `
                            - Animated: ${
                                emojis.cache.filter((e) => e.animated === true)
                                    .size
                            }
                            - Static: ${
                                emojis.cache.filter((e) => !e.animated).size
                            }
                            - Stickers: ${stickers.cache.size}

                            Total: ${emojis.cache.size + stickers.cache.size}
                        `,
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
                        `,
                },
            ]);
    }
}
