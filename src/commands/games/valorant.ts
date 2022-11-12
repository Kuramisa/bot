import { Args } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Message, MessageEmbed } from "discord.js";

export class ValorantCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "valorant",
            description: "Valorant Helper",
            aliases: ["val"],
            subcommands: [
                {
                    name: "login",
                    messageRun: "messageLogin"
                },
                {
                    name: "refresh",
                    messageRun: "messageRefresh"
                },
                {
                    name: "wallet",
                    messageRun: "messageWallet"
                },
                {
                    name: "loadout",
                    messageRun: "messageLoadout"
                },
                {
                    name: "mmr",
                    messageRun: "messageMmr"
                },
                {
                    name: "store",
                    messageRun: "messageStore"
                }
            ]
        });
    }

    /**
     * Register Slash Cocmmand
     */
    public override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .addSubcommand((command) =>
                    command
                        .setName("login")
                        .setDescription("Login to your valorant account")
                )
                .addSubcommand((command) =>
                    command
                        .setName("refresh")
                        .setDescription("Refresh your account")
                )
                .addSubcommand((command) =>
                    command
                        .setName("wallet")
                        .setDescription("Check your Wallet balance")
                )
                .addSubcommand((command) =>
                    command
                        .setName("loadout")
                        .setDescription("Check your or other's loadout")
                        .addStringOption((option) =>
                            option
                                .setName("val_user")
                                .setDescription("View specific Valorant User")
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("mmr")
                        .setDescription("Check your or other's MMR")
                        .addStringOption((option) =>
                            option
                                .setName("val_user")
                                .setDescription("View specific Valorant User")
                                .setAutocomplete(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("act_rank")
                                .setDescription("Act Rank to check MMR for")
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("store")
                        .setDescription("Check Valorant Store")
                        .addStringOption((option) =>
                            option
                                .setName("store_type")
                                .setDescription(
                                    "Which store you wanna check out"
                                )
                                .setChoices(
                                    { name: "My Store", value: "personal" },
                                    {
                                        name: "Featured Store",
                                        value: "featured"
                                    }
                                )
                                .setRequired(true)
                        )
                )
        );
    }

    public async chatInputRun(
        interaction: Subcommand.ChatInputInteraction<"cached">
    ) {
        const {
            games: { valorant }
        } = this.container;

        switch (interaction.options.getSubcommand()) {
            case "login":
                await valorant.login(interaction);
                break;
            case "refresh":
                await valorant.refresh(interaction);
                break;
            case "wallet":
                await valorant.wallet(interaction);
                break;
            case "loadout":
                await valorant.loadout(interaction);
                break;
            case "mmr":
                await valorant.mmr(interaction);
                break;
            case "store":
                await valorant.store(interaction);
                break;
        }
    }

    /**
     * Execute Message Subcommand (Login)
     */
    public messageLogin = (message: Message) =>
        message.reply(
            "You can only login using </valorant login:1027546596398858310> (for security purposes)"
        );

    /**
     * Execute Message Subcommand (Refresh)
     */
    public async messageRefresh(message: Message) {
        const {
            games: { valorant }
        } = this.container;

        const user = message.author;

        const account = valorant.accounts.get(user.id);
        if (!account) return message.reply("You are not logged in");

        await account.auth.refresh();

        return message.reply("Refreshed your account");
    }

    /**
     * Execute Message Subcommand (Wallet)
     */
    public async messageWallet(message: Message) {
        const {
            games: { valorant }
        } = this.container;

        const user = message.author;

        const account = valorant.accounts.get(user.id);
        if (!account) return message.reply("You are not logged in");

        const { data: wallet } = await account.auth.Store.getWallet(
            account.puuid
        );

        if (!wallet) return message.reply("Failed to fetch your wallet");

        const currencies = await account.assets.Currencies.get();

        const balance = [];

        for (let i = 0; i < Object.keys(wallet.Balances).length; i++) {
            const type = currencies.data.data?.find(
                (currency) => currency.uuid === Object.keys(wallet.Balances)[i]
            )?.displayName;
            const amount = Object.values(wallet.Balances)[i];

            balance.push(`**${type}**: ${amount}`);
        }

        return message.reply(balance.join("\n"));
    }
    /**
     * Execute Message Subcommand (Loadout)
     */
    public async messageLoadout(message: Message, args: Args) {
        const {
            games: { valorant }
        } = this.container;
        const { author } = message;

        let account = await args.pick("val_user").catch(() => undefined);

        if (!account) account = valorant.accounts.get(author.id);

        if (!account) return message.reply("You/User not logged in");

        const { data: loadout } =
            await account.auth.Personalization.getPlayerLoadout(account.puuid);

        let page = 0;

        let embeds: MessageEmbed[];

        const pageRow = this.container.util
            .row()
            .setComponents(
                this.container.util
                    .button()
                    .setCustomId("previous_page")
                    .setEmoji("⬅️")
                    .setStyle("SECONDARY"),
                this.container.util
                    .button()
                    .setCustomId("next_page")
                    .setEmoji("➡️")
                    .setStyle("SECONDARY")
            );

        const menuRow = this.container.util
            .row()
            .setComponents(
                this.container.util
                    .button()
                    .setCustomId("profile_page")
                    .setLabel("Profile")
                    .setStyle("SUCCESS"),
                this.container.util
                    .button()
                    .setCustomId("sprays_page")
                    .setLabel("Sprays")
                    .setStyle("PRIMARY"),
                this.container.util
                    .button()
                    .setCustomId("weapons_page")
                    .setLabel("Weapons")
                    .setStyle("SECONDARY")
            );

        const weapons = await Promise.all(
            loadout.Guns.map(async (gun: any) => {
                const info = (
                    await account?.assets.Weapons.getSkinChromaByUuid(
                        gun.ChromaID
                    )
                )?.data.data;

                const embed = this.container.util.embed();

                if (!info) embed.setTitle("Could not fetch the weapon");
                else
                    embed
                        .setTitle(info.displayName.toString())
                        .setImage(info.fullRender);

                return embed;
            })
        );

        const sprays = await Promise.all(
            loadout.Sprays.map(async (spray: any) => {
                const info = (
                    await account?.assets.Sprays.getByUuid(spray.SprayID)
                )?.data.data;

                const embed = this.container.util.embed();

                if (!info) embed.setTitle("Could not fetch the spray");
                else
                    embed
                        .setTitle(info.displayName.toString())
                        .setImage(
                            info.animationGif
                                ? info.animationGif
                                : info.fullTransparentIcon
                        );

                return embed;
            })
        );

        const card = (
            await account.assets.PlayerCards.getByUuid(
                loadout.Identity.PlayerCardID
            )
        ).data.data;

        const title = (
            await account.assets.PlayerTitles.getByUuid(
                loadout.Identity.PlayerTitleID
            )
        ).data.data;

        const profileEmbed = this.container.util
            .embed()
            .setTitle(`${title?.titleText}`)
            .setDescription(
                `${
                    loadout.Identity.HideAccountLevel
                        ? `\`Level\`: ${loadout.Identity.AccountLevel}\n`
                        : ""
                }Card name: ${card?.displayName}`
            )
            .setImage(card?.wideArt as string)
            .setThumbnail(card?.largeArt as string);

        embeds = [profileEmbed];

        const msg = await message.reply({
            embeds: [embeds[page]],
            components: [menuRow]
        });

        const collector = msg.createMessageComponentCollector({
            filter: (i) =>
                (i.customId === "previous_page" ||
                    i.customId === "next_page" ||
                    i.customId === "profile_page" ||
                    i.customId === "sprays_page" ||
                    i.customId === "weapons_page") &&
                i.user.id === author.id,
            time: 35000
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "previous_page":
                        page = page > 0 ? --page : embeds.length - 1;
                        break;
                    case "next_page":
                        page = page + 1 < embeds.length ? ++page : 0;
                        break;
                    case "profile_page":
                        page = 0;
                        embeds = [profileEmbed];
                        break;
                    case "sprays_page":
                        page = 0;
                        embeds = sprays;
                        break;
                    case "weapons_page":
                        page = 0;
                        embeds = weapons;
                        break;
                    default:
                        break;
                }

                await i.deferUpdate();
                await i.editReply({
                    embeds: [embeds[page]],
                    components:
                        i.customId === "profile_page"
                            ? [menuRow]
                            : [pageRow, menuRow]
                });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete")
                    message.delete().catch(console.error);
            });
    }

    /**
     * Execute Message Subcommand (MMR)
     */
    public async messageMmr(message: Message, args: Args) {
        const {
            games: { valorant }
        } = this.container;
        const { author } = message;

        let account = await args.pick("val_user").catch(() => undefined);

        if (!account) account = valorant.accounts.get(author.id);

        if (!account) return message.reply("You/User not logged in");

        const seasons =
            account.rank.QueueSkills.competitive.SeasonalInfoBySeasonID;

        const constructData = async (actId: string) => {
            const actData: any = Object.values(seasons).find(
                (season: any) => season.SeasonID === actId
            );

            const embed = this.container.util.embed();

            if (!actData)
                return embed.setDescription(
                    "No stats found with the given act for this player"
                );

            const act = (
                await valorant.assets.Seasons.getByUuid(actData.SeasonID)
            ).data.data;
            const episode = (
                await valorant.assets.Seasons.getByUuid(
                    act?.parentUuid as string
                )
            ).data.data;

            const ranks = (await valorant.assets.CompetitiveTiers.get()).data
                .data;
            const currentRank = ranks
                ?.find((rank) =>
                    rank.tiers.find(
                        (tier) => tier.tier === actData.CompetitiveTier
                    )
                )
                ?.tiers.find((tier) => tier.tier === actData.CompetitiveTier);

            return embed
                .setTitle(
                    `${account?.player.acct.game_name}#${account?.player.acct.tag_line} - ${author.tag}`
                )
                .setFields(
                    {
                        name: "Season",
                        value: `${this.container.util.capFirstLetter(
                            episode?.displayName
                                .toString()
                                .toLowerCase() as string
                        )} - ${this.container.util.capFirstLetter(
                            act?.displayName.toString().toLowerCase() as string
                        )}`,
                        inline: true
                    },
                    {
                        name: "Rank",
                        value: `${this.container.util.capFirstLetter(
                            currentRank?.tierName
                                .toString()
                                .toLowerCase() as string
                        )}`,
                        inline: true
                    },
                    {
                        name: "Rank Rating",
                        value: `${actData.RankedRating} / 100`,
                        inline: true
                    },
                    {
                        name: "Games Played",
                        value: String(actData.NumberOfGames),
                        inline: true
                    },
                    {
                        name: "Games Won",
                        value: String(actData.NumberOfWins),
                        inline: true
                    }
                )
                .setThumbnail(currentRank?.largeIcon as string);
        };

        const selectOpts = await Promise.all(
            Object.values(seasons).map(async (season: any) => {
                const act = (
                    await valorant.assets.Seasons.getByUuid(season.SeasonID)
                ).data.data;
                const episode = (
                    await valorant.assets.Seasons.getByUuid(
                        act?.parentUuid as string
                    )
                ).data.data;

                const actName = this.container.util.capFirstLetter(
                    act?.displayName.toString().toLowerCase() as string
                );
                const epName = this.container.util.capFirstLetter(
                    episode?.displayName.toString().toLowerCase() as string
                );

                return {
                    label: `${epName} - ${actName}`,
                    value: act?.uuid as string
                };
            })
        );

        const row = this.container.util.row().setComponents(
            this.container.util
                .dropdown()
                .setCustomId("choose_act_rank")
                .setPlaceholder("Choose an Act")
                .setMinValues(1)
                .setMaxValues(1)
                .setOptions(...selectOpts)
        );

        const msg = await message.reply({ components: [row] });

        const collector = msg.createMessageComponentCollector({
            componentType: "SELECT_MENU",
            filter: (i) =>
                i.customId === "choose_act_rank" && i.user.id === author.id,
            time: 35000
        });

        collector
            .on("collect", async (i) => {
                const embed = await constructData(i.values[0]);

                await i.deferUpdate();
                await i.editReply({ embeds: [embed], components: [row] });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete")
                    message.delete().catch(console.error);
            });
    }

    /**
     * Execute Message Subcommand (Store)
     */
    public async messageStore(message: Message, args: Args) {
        const {
            games: { valorant }
        } = this.container;
        const { author } = message;

        let account = await args.pick("val_user").catch(() => undefined);

        if (!account) account = valorant.accounts.get(author.id);

        if (!account) return message.reply("You/User not logged in");

        const storeType = await args.pick("string").catch(() => undefined);

        if (!storeType)
            return message.reply(
                "Please provide store type: `personal` *or* `featured`"
            );

        const { data: store } = await account.auth.Store.getStorefront(
            account.puuid
        );

        if (!store)
            return message.reply({
                content:
                    "Failed to fetch the store try logging in or refreshing your account"
            });

        const featured = store.FeaturedBundle;
        const daily = store.SkinsPanelLayout;

        let page = 0;
        const buttons = [
            this.container.util
                .button()
                .setCustomId("previous_page")
                .setEmoji("⬅️")
                .setStyle("SECONDARY"),
            this.container.util
                .button()
                .setCustomId("next_page")
                .setEmoji("➡️")
                .setStyle("SECONDARY")
        ];

        const row = this.container.util.row().addComponents(buttons);

        let embeds: MessageEmbed[] = [];

        switch (storeType) {
            case "featured": {
                embeds = (
                    await Promise.all(
                        featured.Bundle.Items.map(
                            async (bundleItem: any, index: number) => {
                                const embed = this.container.util.embed();

                                let item: any;
                                switch (bundleItem.Item.ItemTypeID) {
                                    case "d5f120f8-ff8c-4aac-92ea-f2b5acbe9475": {
                                        item = (
                                            await account?.assets.Sprays.getByUuid(
                                                bundleItem.Item.ItemID
                                            )
                                        )?.data.data;
                                        break;
                                    }
                                    case "dd3bf334-87f3-40bd-b043-682a57a8dc3a": {
                                        item = (
                                            await account?.assets.Buddies.getLevelByUuid(
                                                bundleItem.Item.ItemID
                                            )
                                        )?.data.data;
                                        break;
                                    }
                                    case "e7c63390-eda7-46e0-bb7a-a6abdacd2433": {
                                        item = (
                                            await account?.assets.Weapons.getSkinLevelByUuid(
                                                bundleItem.Item.ItemID
                                            )
                                        )?.data.data;
                                        break;
                                    }
                                    case "3f296c07-64c3-494c-923b-fe692a4fa1bd": {
                                        item = (
                                            await account?.assets.PlayerCards.getByUuid(
                                                bundleItem.Item.ItemID
                                            )
                                        )?.data.data;
                                        break;
                                    }
                                }

                                if (!item) return null;

                                embed
                                    .setTitle(`${item.displayName} - Featured`)
                                    .setDescription(
                                        `**Price: ${bundleItem.BasePrice}**`
                                    );

                                if (item.animationGif)
                                    embed.setImage(item.animationGif);
                                else if (item.wideArt) {
                                    embed.setImage(item.wideArt);
                                    embed.setThumbnail(item.largeArt);
                                } else embed.setImage(item.displayIcon);

                                return embed.setFooter({
                                    text: `Item ${index + 1} of ${
                                        featured.Bundle.Items.length
                                    }`
                                });
                            }
                        )
                    )
                )
                    .filter((el) => el !== null)
                    .filter((el) => el !== undefined);
                break;
            }
            case "personal": {
                embeds = await Promise.all(
                    daily.SingleItemOffers.map(
                        async (offer: any, index: number) => {
                            const embed = this.container.util.embed();

                            const item = (
                                await account?.assets.Weapons.getSkinLevelByUuid(
                                    offer
                                )
                            )?.data.data;

                            if (!item) return null;

                            return embed
                                .setTitle(`${item.displayName} - Daily`)
                                .setImage(item.displayIcon)
                                .setFooter({
                                    text: `Item ${index + 1} of ${
                                        daily.SingleItemOffers.length
                                    }`
                                });
                        }
                    )
                );
                break;
            }
        }

        if (embeds.length < 1)
            return message.reply({
                content: "Could not fetch your store"
            });

        const msg = await message.reply({
            embeds: [embeds[page]],
            components: [row]
        });

        const collector = msg.createMessageComponentCollector({
            componentType: "BUTTON",
            filter: (i) =>
                i.user.id === author.id &&
                (i.customId === "previous_page" || i.customId === "next_page"),
            time: 30000
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "previous_page":
                        page = page > 0 ? --page : embeds.length - 1;
                        break;
                    case "next_page":
                        page = page + 1 < embeds.length ? ++page : 0;
                        break;
                    default:
                        break;
                }

                await i.deferUpdate();
                await i.editReply({
                    embeds: [embeds[page]],
                    components: [row]
                });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete")
                    message.delete().catch(console.error);
            });
    }
}
