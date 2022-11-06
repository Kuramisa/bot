import Shinobi, { IShinobi } from "#schemas/Shinobi";

import { ShinobiStats, ShinobiWeapon, ShinobiRanks, Currencies } from "@types";

import { CommandInteraction, ContextMenuInteraction } from "discord.js";

import ShinobiGame from "..";

export default class ShinobiPlayer {
    private readonly game: ShinobiGame;

    readonly id: string;
    readonly _name: string;
    private _clan: string;
    private _village: string;
    private _rank: ShinobiRanks;
    xp: number;
    level: number;
    stats: ShinobiStats;
    weapons: ShinobiWeapon[];
    equipped: IShinobi["equipped"];

    constructor(game: ShinobiGame, player: IShinobi) {
        this.game = game;
        this.id = player.memberId;
        this._name = player.username;
        this._clan = player.clan;
        this._village = player.village;
        this._rank = player.rank;
        this.xp = player.xp;
        this.level = player.level;
        this.stats = player.stats;
        this.weapons = player.weapons;
        this.equipped = player.equipped;
    }

    get player() {
        return async () => await Shinobi.findOne({ memberId: this.id });
    }

    get name() {
        return this._name;
    }

    get village() {
        return this.game.villages.get(this._village);
    }

    get clan() {
        return this.game.clans.get(this._clan);
    }

    get rank() {
        return this.game.container.util.capFirstLetter(
            this._rank
        ) as ShinobiRanks;
    }

    set rank(rank: ShinobiRanks) {
        this._rank = rank;
    }

    async equip(
        interaction:
            | CommandInteraction<"cached">
            | ContextMenuInteraction<"cached">,
        weapon: ShinobiWeapon
    ) {
        const shinobi = await Shinobi.findOne({
            memberId: interaction.member.id
        });

        if (!shinobi)
            return interaction.reply({
                content: "You cannot equip any weapons, you are not a shinobi",
                ephemeral: true
            });

        if (!shinobi.weapons.find((wp) => weapon.id === wp.id))
            return interaction.reply({
                content: `You do not own ${weapon.name}`,
                ephemeral: true
            });

        this.equipped.weapon = weapon;
        shinobi.equipped.weapon = weapon;

        await shinobi.save();

        const embed = this.game.weapons.embed(weapon);

        return interaction.reply({
            content: `Equipped **${weapon.name}**`,
            embeds: [embed],
            ephemeral: true
        });
    }
}
