import { Container } from "@sapphire/pieces";
import {
    CommandInteraction,
    Collection,
    MessageEmbed,
    Message
} from "discord.js";

import { Client as Assets } from "@valapi/valorant-api.com";
import { Client as Web } from "@valapi/web-client";

import { ValorantAccount } from "@types";

export default class Valorant {
    private readonly container: Container;

    readonly assets: Assets;
    private readonly _web: typeof Web;

    readonly accounts: Collection<string, ValorantAccount>;

    constructor(container: Container) {
        this.container = container;

        this.assets = new Assets();
        this._web = Web;

        this.accounts = new Collection();
    }

    async login(interaction: CommandInteraction<"cached">) {
        const { user } = interaction;

        const web = new this._web();

        const loginModal = this.container.util
            .modal()
            .setCustomId("valorant-login-modal")
            .setTitle("Login to your Valorant Account")
            .setComponents(
                this.container.util
                    .modalRow()
                    .setComponents(
                        this.container.util
                            .input()
                            .setCustomId("valorant-username")
                            .setLabel("Your Valorant Username")
                            .setStyle("SHORT")
                            .setRequired(true)
                    ),
                this.container.util
                    .modalRow()
                    .setComponents(
                        this.container.util
                            .input()
                            .setCustomId("valorant-password")
                            .setLabel("Your Valorant Password")
                            .setPlaceholder("WE DO NOT STORE THEM")
                            .setStyle("SHORT")
                            .setRequired(true)
                    )
            );
        await interaction.showModal(loginModal);

        const loginSubmit = await interaction.awaitModalSubmit({ time: 0 });

        const username =
            loginSubmit.fields.getTextInputValue("valorant-username");
        const password =
            loginSubmit.fields.getTextInputValue("valorant-password");

        await web.login(username, password).catch(console.error);

        if (web.isMultifactor) {
            const row = this.container.util
                .row()
                .setComponents(
                    this.container.util
                        .button()
                        .setCustomId("accept-mfa")
                        .setLabel("Accept MFA")
                        .setStyle("SUCCESS"),
                    this.container.util
                        .button()
                        .setCustomId("decline-mfa")
                        .setLabel("Decline MFA")
                        .setStyle("DANGER")
                );

            const askContinue = await loginSubmit.reply({
                content:
                    "**It seems your account has Multi-Factor Authentication enabled. Do you want to continue?**",
                components: [row],
                fetchReply: true,
                ephemeral: true
            });

            const acceptOrDecline = await askContinue.awaitMessageComponent({
                componentType: "BUTTON",
                filter: (i) =>
                    i.customId === "accept-mfa" || i.customId === "decline-mfa"
            });

            switch (acceptOrDecline.customId) {
                case "accept-mfa": {
                    const mfaModal = this.container.util
                        .modal()
                        .setCustomId("mfa-valorant-verify")
                        .setTitle("Enter your MFA Code")
                        .setComponents(
                            this.container.util
                                .modalRow()
                                .setComponents(
                                    this.container.util
                                        .input()
                                        .setCustomId("mfa-code")
                                        .setLabel("MFA Code")
                                        .setPlaceholder(
                                            "This code should arrive on your email"
                                        )
                                        .setStyle("SHORT")
                                        .setRequired(true)
                                )
                        );

                    await acceptOrDecline.showModal(mfaModal);
                    const mfaSubmit = await acceptOrDecline.awaitModalSubmit({
                        time: 0
                    });

                    const mfaCode =
                        mfaSubmit.fields.getTextInputValue("mfa-code");

                    await web.verify(parseInt(mfaCode));

                    await mfaSubmit.deferUpdate();
                    await acceptOrDecline.editReply({
                        content: "You have logged in to your account",
                        components: []
                    });
                    break;
                }
                case "decline-mfa": {
                    await acceptOrDecline.update({
                        content:
                            "You declined to enter your MFA code, we couldn't log in to your account",
                        components: []
                    });
                    break;
                }
            }
        }

        if (web.toJSON().access_token.length < 1 && !loginSubmit.replied)
            return loginSubmit.reply({
                content: "Incorrect password or username was entered",
                ephemeral: true
            });

        const puuid = web.getSubject(web.toJSON().access_token);

        const playerInfo = (await web.Player.getUserInfo()).data;
        const rankInfo = (await web.MMR.fetchPlayer(puuid)).data;

        this.accounts.set(user.id, {
            memberId: user.id,
            assets: this.assets,
            auth: web,
            puuid,
            player: playerInfo,
            rank: rankInfo
        });

        if (!loginSubmit.replied)
            return loginSubmit.reply({
                content: "You have logged in to your account",
                ephemeral: true
            });
    }

    async refresh(interaction: CommandInteraction) {
        const { user } = interaction;

        const account = this.accounts.get(user.id);
        if (!account)
            return interaction.reply({
                content: "You are not logged in",
                ephemeral: true
            });

        await account.auth.refresh(true);

        return interaction.reply({
            content: "Refreshed your account",
            ephemeral: true
        });
    }

    async wallet(interaction: CommandInteraction | Message) {
        let user = null;

        if (interaction instanceof CommandInteraction) user = interaction.user;
        else user = interaction.author;

        const account = this.accounts.get(user.id);
        if (!account)
            return interaction.reply({
                content: "You are not logged in",
                ephemeral: true
            });

        const { data: wallet, isError } = await account.auth.Store.getWallet(
            account.puuid
        );

        if (isError && !wallet)
            return interaction.reply({
                content: "Could not fetch your wallet",
                ephemeral: true
            });

        if (interaction instanceof CommandInteraction)
            await interaction.deferReply({ ephemeral: true });

        const currencies = await account.assets.Currencies.get();

        const balance = [];

        for (let i = 0; i < Object.keys(wallet.Balances).length; i++) {
            const type = currencies.data.data?.find(
                (currency) => currency.uuid === Object.keys(wallet.Balances)[i]
            )?.displayName;
            const amount = Object.values(wallet.Balances)[i];

            balance.push(`**${type}**: ${amount}`);
        }

        if (interaction instanceof Message)
            return interaction.edit(balance.join("\n"));

        interaction.editReply({ content: balance.join("\n") });
    }

    async store(interaction: CommandInteraction<"cached">) {
        const { options, member } = interaction;

        const account = this.accounts.get(member.id);

        if (!account)
            return interaction.reply({
                content: "You are not logged in",
                ephemeral: true
            });

        const storeType = options.getString("store_type", true);

        const { data: store, isError } = await account.auth.Store.getStorefront(
            account.puuid
        );

        if (isError && !store)
            return interaction.reply({
                content:
                    "Failed to fetch the store try logging in or refreshing your account",
                ephemeral: true
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
                                            await account.assets.Sprays.getByUuid(
                                                bundleItem.Item.ItemID
                                            )
                                        ).data.data;
                                        break;
                                    }
                                    case "dd3bf334-87f3-40bd-b043-682a57a8dc3a": {
                                        item = (
                                            await account.assets.Buddies.getLevelByUuid(
                                                bundleItem.Item.ItemID
                                            )
                                        ).data.data;
                                        break;
                                    }
                                    case "e7c63390-eda7-46e0-bb7a-a6abdacd2433": {
                                        item = (
                                            await account.assets.Weapons.getSkinLevelByUuid(
                                                bundleItem.Item.ItemID
                                            )
                                        ).data.data;
                                        break;
                                    }
                                    case "3f296c07-64c3-494c-923b-fe692a4fa1bd": {
                                        item = (
                                            await account.assets.PlayerCards.getByUuid(
                                                bundleItem.Item.ItemID
                                            )
                                        ).data.data;
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
                                await account.assets.Weapons.getSkinLevelByUuid(
                                    offer
                                )
                            ).data.data;

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
            return interaction.reply({
                content: "Could not fetch your store",
                ephemeral: true
            });

        if (!interaction.deferred) await interaction.deferReply();

        const message = await interaction.editReply({
            embeds: [embeds[page]],
            components: [row]
        });

        const collector = message.createMessageComponentCollector({
            componentType: "BUTTON",
            filter: (i) =>
                i.user.id === member.id &&
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
                if (reason !== "messageDelete") message.delete();
            });
    }

    async loadout(interaction: CommandInteraction<"cached">) {
        const { options, member } = interaction;

        const playerGiven = options.getString("val_account");

        const user = playerGiven
            ? this.container.client.users.cache.get(playerGiven)
            : interaction.user;

        if (!user)
            return interaction.reply({
                content: "Invalid user",
                ephemeral: true
            });

        const account = this.accounts.get(user.id);

        if (!account)
            return interaction.reply({
                content: "User not logged in",
                ephemeral: true
            });

        await interaction.deferReply();

        const { data: loadout, isError } = await account.auth.Player.loadout(
            account.puuid
        );

        if (!loadout && isError)
            return interaction.reply({
                content: "Could not fetch your loadout",
                ephemeral: true
            });

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
                    await account.assets.Weapons.getSkinChromaByUuid(
                        gun.ChromaID
                    )
                ).data.data;

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
                    await account.assets.Sprays.getByUuid(spray.SprayID)
                ).data.data;

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

        const message = await interaction.editReply({
            embeds: [embeds[page]],
            components: [menuRow]
        });

        const collector = message.createMessageComponentCollector({
            filter: (i) =>
                (i.customId === "previous_page" ||
                    i.customId === "next_page" ||
                    i.customId === "profile_page" ||
                    i.customId === "sprays_page" ||
                    i.customId === "weapons_page") &&
                i.user.id === member.id,
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
                if (reason !== "messageDelete") message.delete();
            });
    }

    async mmr(interaction: CommandInteraction<"cached">) {
        const { options, member } = interaction;

        const playerGiven = options.getString("val_account");
        const actGiven = options.getString("act_rank");

        const user = playerGiven
            ? this.container.client.users.cache.get(playerGiven)
            : interaction.user;

        if (!user)
            return interaction.reply({
                content: "Invalid user",
                ephemeral: true
            });

        const account = this.accounts.get(user.id);

        if (!account)
            return interaction.reply({
                content: "User not logged in",
                ephemeral: true
            });

        await interaction.deferReply();

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

            const act = (await this.assets.Seasons.getByUuid(actData.SeasonID))
                .data.data;
            const episode = (
                await this.assets.Seasons.getByUuid(act?.parentUuid as string)
            ).data.data;

            const ranks = (await this.assets.CompetitiveTiers.get()).data.data;
            const currentRank = ranks
                ?.find((rank) =>
                    rank.tiers.find(
                        (tier) => tier.tier === actData.CompetitiveTier
                    )
                )
                ?.tiers.find((tier) => tier.tier === actData.CompetitiveTier);

            return embed
                .setTitle(
                    `${account.player.acct.game_name}#${account.player.acct.tag_line} - ${user.tag}`
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

        if (actGiven) {
            const embed = await constructData(actGiven);

            return interaction.editReply({
                embeds: [embed]
            });
        }

        const selectOpts = await Promise.all(
            Object.values(seasons).map(async (season: any) => {
                const act = (
                    await this.assets.Seasons.getByUuid(season.SeasonID)
                ).data.data;
                const episode = (
                    await this.assets.Seasons.getByUuid(
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

        const message = await interaction.editReply({ components: [row] });

        const collector = await message.createMessageComponentCollector({
            componentType: "SELECT_MENU",
            filter: (i) =>
                i.customId === "choose_act_rank" && i.user.id === member.id,
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
                if (reason !== "messageDelete") message.delete();
            });
    }
}
