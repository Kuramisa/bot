import { Args, Command } from "@sapphire/framework";
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    Message
} from "discord.js";
import moment from "moment";

export class SteamCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "steam",
            description: "Steam Helper"
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
                .addStringOption((option) =>
                    option
                        .setName("steam_user")
                        .setDescription("Steam User URL/ID")
                        .setRequired(true)
                )
        );
    }

    /**
     * Execute Message Command
     */
    async messageRun(message: Message, args: Args) {
        let urlOrId = await args.pick("string").catch(() => null);
        if (!urlOrId)
            return message.reply("Please provide a steam profile URL/ID");

        const {
            games: { steam },
            util
        } = this.container;

        if (
            !parseInt(urlOrId) &&
            !urlOrId.includes("https://steamcommunity.com")
        ) {
            urlOrId = `https://steamcommunity.com/id/${urlOrId}`;
        }

        try {
            const resolveId = await steam.resolve(urlOrId);

            let userProfile = await this.fetchUser(resolveId);

            const row = util
                .row()
                .setComponents(
                    util
                        .button()
                        .setCustomId("steam-profile")
                        .setLabel("Profile")
                        .setStyle(ButtonStyle.Success),
                    util
                        .button()
                        .setCustomId("steam-games")
                        .setLabel("Games")
                        .setStyle(ButtonStyle.Primary)
                );

            const navRow = util
                .row()
                .setComponents(
                    util
                        .button()
                        .setCustomId("prev_page")
                        .setEmoji("◀")
                        .setStyle(ButtonStyle.Secondary),
                    util
                        .button()
                        .setCustomId("next_page")
                        .setEmoji("▶")
                        .setStyle(ButtonStyle.Secondary)
                );

            let page = 0;

            const msg = await message.reply({
                embeds: [],
                components: [row]
            });

            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (i) =>
                    i.customId === "steam-profile" ||
                    i.customId === "steam-games" ||
                    i.customId === "prev_page" ||
                    i.customId === "next_page",
                time: 15000
            });

            let embeds = [this.profileEmbed(userProfile)];

            collector.on("collect", async (i) => {
                if (message.author.id !== i.user.id) {
                    i.reply({
                        content: "This command was not executed by you",
                        ephemeral: true
                    });
                    return;
                }
                try {
                    switch (i.customId) {
                        case "steam-profile": {
                            userProfile = await this.fetchUser(resolveId);

                            embeds = [this.profileEmbed(userProfile)];
                            await message.edit({
                                components: [row]
                            });
                            break;
                        }
                        case "steam-games": {
                            const userGames = await steam.getUserOwnedGames(
                                resolveId
                            );

                            embeds = userGames
                                .sort((a, b) => b.playTime - a.playTime)
                                .map((game) =>
                                    util
                                        .embed()
                                        .setAuthor({
                                            name: `${game.name} - App ID: ${game.appID}`,
                                            iconURL: game.iconURL
                                        })
                                        .setDescription(
                                            `**Play time**\n\`Last 2 Weeks\`: ${
                                                game.playTime2 > 60 &&
                                                game.playTime2 !== 0
                                                    ? `${Math.round(
                                                          moment
                                                              .duration(
                                                                  game.playTime2
                                                              )
                                                              .asHours()
                                                      )} Hours`
                                                    : `${game.playTime2} Mintues`
                                            }\n\`Total\`: ${
                                                game.playTime > 60 &&
                                                game.playTime !== 0
                                                    ? `${Math.round(
                                                          moment
                                                              .duration(
                                                                  game.playTime,
                                                                  "minutes"
                                                              )
                                                              .asHours()
                                                      )} Hours`
                                                    : `${game.playTime} Mintues`
                                            }`
                                        )
                                        .setThumbnail(game.iconURL)
                                );
                            await message.edit({
                                components: [row, navRow]
                            });
                            break;
                        }
                        case "prev_page":
                            page = page > 0 ? --page : embeds.length - 1;
                            break;
                        case "next_page":
                            page = page + 1 < embeds.length ? ++page : 0;
                            break;
                    }

                    await message.edit({ embeds: [embeds[page]] });
                    await i.deferUpdate();
                } catch (err) {
                    console.trace(err);
                    await i.reply({
                        content: `\`\`\`xl\n${err}\`\`\``,
                        ephemeral: true
                    });
                }
                collector.resetTimer();
            });
        } catch {
            return message.reply("Steam user not found");
        }
    }

    /**
     * Execute Slash Command
     */
    async chatInputRun(interaction: ChatInputCommandInteraction<"cached">) {
        const {
            games: { steam },
            util
        } = this.container;

        const { options } = interaction;

        let urlOrId = options.getString("steam_user", true);

        if (
            !parseInt(urlOrId) &&
            !urlOrId.includes("https://steamcommunity.com")
        ) {
            urlOrId = `https://steamcommunity.com/id/${urlOrId}`;
        }

        try {
            const resolveId = await steam.resolve(urlOrId);

            let userProfile = await this.fetchUser(resolveId);

            const row = util
                .row()
                .setComponents(
                    util
                        .button()
                        .setCustomId("steam-profile")
                        .setLabel("Profile")
                        .setStyle(ButtonStyle.Success),
                    util
                        .button()
                        .setCustomId("steam-games")
                        .setLabel("Games")
                        .setStyle(ButtonStyle.Primary)
                );

            const navRow = util
                .row()
                .setComponents(
                    util
                        .button()
                        .setCustomId("prev_page")
                        .setEmoji("◀")
                        .setStyle(ButtonStyle.Secondary),
                    util
                        .button()
                        .setCustomId("next_page")
                        .setEmoji("▶")
                        .setStyle(ButtonStyle.Secondary)
                );

            let page = 0;

            const message = await interaction.reply({
                embeds: [],
                components: [row],
                fetchReply: true
            });

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (i) =>
                    i.customId === "steam-profile" ||
                    i.customId === "steam-games" ||
                    i.customId === "prev_page" ||
                    i.customId === "next_page",
                time: 15000
            });

            let embeds = [this.profileEmbed(userProfile)];

            collector.on("collect", async (i) => {
                if (interaction.user.id !== i.user.id) {
                    i.reply({
                        content: "This command was not executed by you",
                        ephemeral: true
                    });
                    return;
                }
                try {
                    switch (i.customId) {
                        case "steam-profile": {
                            userProfile = await this.fetchUser(resolveId);

                            embeds = [this.profileEmbed(userProfile)];
                            await interaction.editReply({
                                components: [row]
                            });
                            break;
                        }
                        case "steam-games": {
                            const userGames = await steam.getUserOwnedGames(
                                resolveId
                            );

                            embeds = userGames
                                .sort((a, b) => b.playTime - a.playTime)
                                .map((game) =>
                                    util
                                        .embed()
                                        .setAuthor({
                                            name: `${game.name} - App ID: ${game.appID}`,
                                            iconURL: game.iconURL
                                        })
                                        .setDescription(
                                            `**Play time**\n\`Last 2 Weeks\`: ${
                                                game.playTime2 > 60 &&
                                                game.playTime2 !== 0
                                                    ? `${Math.round(
                                                          moment
                                                              .duration(
                                                                  game.playTime2
                                                              )
                                                              .asHours()
                                                      )} Hours`
                                                    : `${game.playTime2} Mintues`
                                            }\n\`Total\`: ${
                                                game.playTime > 60 &&
                                                game.playTime !== 0
                                                    ? `${Math.round(
                                                          moment
                                                              .duration(
                                                                  game.playTime,
                                                                  "minutes"
                                                              )
                                                              .asHours()
                                                      )} Hours`
                                                    : `${game.playTime} Mintues`
                                            }`
                                        )
                                        .setThumbnail(game.iconURL)
                                );
                            await interaction.editReply({
                                components: [row, navRow]
                            });
                            break;
                        }
                        case "prev_page":
                            page = page > 0 ? --page : embeds.length - 1;
                            break;
                        case "next_page":
                            page = page + 1 < embeds.length ? ++page : 0;
                            break;
                    }

                    await interaction.editReply({ embeds: [embeds[page]] });
                    await i.deferUpdate();
                } catch (err) {
                    console.trace(err);
                    await i.reply({
                        content: `\`\`\`xl\n${err}\`\`\``,
                        ephemeral: true
                    });
                }
                collector.resetTimer();
            });
        } catch {
            interaction.reply({
                content: "Steam user not found",
                ephemeral: true
            });
        }
    }

    private personaState(state: number) {
        switch (state) {
            case 0:
                return "Offline";
            case 1:
                return "Online";
            case 2:
                return "Busy";
            case 3:
                return "Away";
            case 4:
                return "Snooze";
            case 5:
                return "Looking to trade";
            case 6:
                return "Looking to play";
        }
    }

    private fetchUser = async (id: string) => {
        const {
            games: { steam }
        } = this.container;

        return {
            ...(await steam.getUserSummary(id)),
            ...(await steam.getUserBans(id)),
            ...(await steam.getUserBadges(id))
        };
    };

    private profileEmbed(userProfile: any) {
        const { util } = this.container;

        const embed = util
            .embed()
            .setAuthor({
                name: `${userProfile.nickname} Steam Profile`,
                iconURL: userProfile.avatar.medium,
                url: userProfile.url
            })
            .setThumbnail(userProfile.avatar.large);

        if (userProfile.visibilityState === 1)
            embed.setDescription("Profile is private");
        else {
            embed
                .setDescription(
                    `Currently ${this.personaState(userProfile.personaState)}`
                )
                .addFields(
                    {
                        name: "Created",
                        value: `<t:${userProfile.created}:R>`
                    },
                    {
                        name: "XP",
                        value: `\`Current\`: ${userProfile.playerXP}\n\`Needed\`: ${userProfile.playerNextLevelXP}`,
                        inline: true
                    },
                    {
                        name: "Level",
                        value: `${userProfile.playerLevel}`,
                        inline: true
                    },
                    {
                        name: "Bans",
                        value: `\`Community\`: ${this.yesNo(
                            userProfile.communityBanned
                        )}\n\`VAC\`: ${this.yesNo(userProfile.vacBanned)} ${
                            userProfile.vacBanned
                                ? `(${userProfile.daysSinceLastBan} days ago)`
                                : ""
                        }\n\`Economy\`: ${userProfile.economyBan}`
                    }
                );
        }

        return embed;
    }

    private yesNo = (bool: boolean) => (bool ? "Yes" : "No");
}
