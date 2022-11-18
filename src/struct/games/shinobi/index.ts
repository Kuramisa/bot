import { Container } from "@sapphire/pieces";
import { ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import { Naruto } from "anime-info";
import ms from "ms";
import moment from "moment";

import Shinobi from "#schemas/Shinobi";

import ShinobiClans from "./clans";
import ShinobiPlayers from "./players";
import ShinobiVillages from "./villages";
import ShinobiWeapons from "./weapons";

import ShinobiPlayer from "./players/Player";

export default class ShinobiGame {
    readonly container: Container;

    readonly api: Naruto;
    readonly clans: ShinobiClans;
    readonly players: ShinobiPlayers;
    readonly villages: ShinobiVillages;
    readonly weapons: ShinobiWeapons;

    constructor(container: Container) {
        this.container = container;

        this.api = new Naruto();
        this.clans = new ShinobiClans(this);
        this.players = new ShinobiPlayers(this);
        this.villages = new ShinobiVillages(this);
        this.weapons = new ShinobiWeapons(this);
    }

    async start(interaction: ChatInputCommandInteraction<"cached">) {
        const { util } = this.container;

        const { user } = interaction;

        const player = await Shinobi.findOne({ memberId: user.id });

        if (player)
            return interaction.reply({
                content: "You are already are a shinobi",
                ephemeral: true
            });

        const embed = util
            .embed()
            .setTitle("Rules of Shinobi Adventure")
            .setDescription(
                "**DO NOT create multiple accounts to start multiple adventures** *we ask this because we want to make the game fair for all players* (more rules coming soon)"
            );

        const row = util
            .row()
            .setComponents([
                util
                    .button()
                    .setCustomId("accept_game_rules")
                    .setLabel("Accept")
                    .setStyle(ButtonStyle.Success),
                util
                    .button()
                    .setCustomId("decline_game_rules")
                    .setLabel("Decline")
                    .setStyle(ButtonStyle.Danger)
            ]);

        const message = await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
            fetchReply: true
        });

        message
            .createMessageComponentCollector({
                filter: (i) =>
                    (i.customId === "accept_game_rules" ||
                        i.customId === "decline_game_rules") &&
                    i.user.id == user.id,
                time: 5000
            })
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "accept_game_rules": {
                        const clan = this.clans.random();
                        if (!clan) return;
                        const village = this.villages.random();
                        if (!village) return;

                        const shinobi = await Shinobi.create({
                            memberId: user.id,
                            clan: clan.id,
                            village: village.id,
                            stats: clan.stats
                        });

                        i.deferUpdate();

                        await interaction.editReply({
                            content: `You became a genin. You were born in **${clan.name}** - **${village.name.en}**`,
                            embeds: [],
                            components: []
                        });

                        const player = new ShinobiPlayer(this, shinobi);

                        this.players.set(user.id, player);

                        break;
                    }
                    case "decline_game_rules": {
                        i.deferUpdate();

                        await interaction.editReply({
                            content:
                                "You declined the rules, you did not become a shinobi",
                            embeds: [],
                            components: []
                        });
                        break;
                    }
                }
            });
    }

    async delete(interaction: ChatInputCommandInteraction<"cached">) {
        const { owners } = this.container;

        const { options, user } = interaction;

        if (!owners.includes(user.id))
            return interaction.reply({
                content: "You cannot use this command",
                ephemeral: true
            });

        const sh = options.getString("player", true);

        const player = this.players.get(sh);

        if (!player)
            return interaction.reply({
                content: `${sh} is not a Shinobi`,
                ephemeral: true
            });

        const target = interaction.guild?.members.cache.get(player.id);

        await Shinobi.deleteOne({ memberId: sh });

        this.players.delete(sh);

        return interaction.reply({
            content: `Resigned ${target} from being a shinobi`,
            ephemeral: true
        });
    }

    async daily(interaction: ChatInputCommandInteraction<"cached">) {
        const { user } = interaction;

        const player = await Shinobi.findOne({ memberId: user.id });

        if (!player)
            return interaction.reply({
                content: "You are not a Shinobi",
                ephemeral: true
            });

        if (Date.now() < player.cooldowns.daily)
            return interaction.reply({
                content: `You can claim your daily reward **${moment(
                    player.cooldowns.daily
                ).fromNow()}**`,
                ephemeral: true
            });

        const ryo = Math.floor(Math.random() * 100);

        player.currencies.ryo += ryo;
        player.cooldowns.daily = Date.now() + ms("1d");

        await player.save();

        return interaction.reply({
            content: `You received **${ryo} Ryo** from your daily`,
            ephemeral: true
        });
    }

    async weekly(interaction: ChatInputCommandInteraction<"cached">) {
        const { member } = interaction;

        const player = await Shinobi.findOne({ memberId: member.id });

        if (!player)
            return interaction.reply({
                content: "You are not a Shinobi",
                ephemeral: true
            });

        if (Date.now() < player.cooldowns.weekly)
            return interaction.reply({
                content: `You can claim your weekly reward **${moment(
                    player.cooldowns.weekly
                ).fromNow()}**`,
                ephemeral: true
            });

        const ryo =
            Math.floor(Math.random() * 400) + Math.floor(Math.random() * 1000);

        player.currencies.ryo += ryo;
        player.cooldowns.weekly = Date.now() + ms("7d");

        await player.save();

        return interaction.reply({
            content: `You received **${ryo} Ryo** from your daily`,
            ephemeral: true
        });
    }

    async fight(interaction: ChatInputCommandInteraction<"cached">) {
        const { util } = this.container;

        const { options, member } = interaction;

        const player1 = this.players.get(member.id);
        const player2 = this.players.get(options.getString("player", true));

        if (!player1) return;
        if (!player2) return;

        const embed = util
            .embed()
            .setTitle(`${player1.name} is fighting ${player2.name}`);

        await interaction.reply({ embeds: [embed] });
    }
}
