import { Container } from "@sapphire/pieces";
import { Collection, CommandInteraction } from "discord.js";
import ShinobiGame from "../";
import Weapons from "./Weapons";
import { ShinobiWeapon } from "@types";

import Shinobi from "#schemas/Shinobi";

export default class ShinobiWeapons {
    private readonly container: Container;
    private readonly game: ShinobiGame;

    private readonly list: Collection<string, ShinobiWeapon>;

    constructor(game: ShinobiGame) {
        this.container = game.container;
        this.game = game;

        this.list = new Collection();
        this.setup();
    }

    get = (id: string) => this.list.get(id);
    getAll = () => this.list;
    random = () => this.list.random();

    embed = (weapon: ShinobiWeapon) =>
        this.container.util
            .embed()
            .setTitle(weapon.name)
            .setDescription(`\`Attack\`: ${weapon.attack}`)
            .setThumbnail(weapon.icon)
            .setFooter({ text: `Cost: ${weapon.cost}` });

    async buy(
        interaction: CommandInteraction<"cached">,
        weapon: ShinobiWeapon
    ) {
        const shinobi = await Shinobi.findOne({
            memberId: interaction.member.id
        });

        if (!shinobi)
            return interaction.reply({
                content: "You cannot buy any weapons, you are not a shinobi",
                ephemeral: true
            });

        if (shinobi.weapons.find((wp) => weapon.id === wp.id))
            return interaction.reply({
                content: `You already own ${weapon.name}`,
                ephemeral: true
            });

        if (shinobi.currencies.ryo < weapon.cost)
            return interaction.reply({
                content: `You do not have enough ryo to buy this weapon, \`Current Balance\`: ${shinobi.currencies.ryo} Ryo`,
                ephemeral: true
            });

        shinobi.currencies.ryo -= weapon.cost;
        shinobi.weapons.push(weapon);

        await shinobi.save();

        const embed = this.game.weapons.embed(weapon);

        return interaction.reply({
            content: `Bought **${weapon.name}** for ${weapon.cost} Ryo`,
            embeds: [embed],
            ephemeral: true
        });
    }

    async sell(
        interaction: CommandInteraction<"cached">,
        weapon: ShinobiWeapon
    ) {
        const shinobi = await Shinobi.findOne({
            memberId: interaction.member.id
        });

        if (!shinobi)
            return interaction.reply({
                content: "You cannot buy any weapons, you are not a shinobi",
                ephemeral: true
            });

        if (!shinobi.weapons.find((wp) => weapon.id === wp.id))
            return interaction.reply({
                content: `You do not own ${weapon.name}`,
                ephemeral: true
            });

        const sellPrice = weapon.cost / 2;

        shinobi.currencies.ryo += sellPrice;
        shinobi.weapons = shinobi.weapons.filter((wp) => weapon.id !== wp.id);

        if (shinobi.equipped.weapon?.id === weapon.id)
            shinobi.equipped.weapon = null;

        await shinobi.save();

        const embed = this.game.weapons.embed(weapon);

        return interaction.reply({
            content: `Sold **${weapon.name}** for ${sellPrice} Ryo`,
            embeds: [embed],
            ephemeral: true
        });
    }

    async pagination(interaction: CommandInteraction<"cached">) {
        const { util } = this.container;

        const weapons = this.getAll();

        let page = 0;

        const buttons = [
            util
                .button()
                .setCustomId("previous_page")
                .setEmoji("⬅️")
                .setStyle("SECONDARY"),
            util
                .button()
                .setCustomId("next_page")
                .setEmoji("➡️")
                .setStyle("SECONDARY")
        ];

        const row = util.row().addComponents(buttons);

        const embeds = weapons.map((weapon) => this.embed(weapon));

        if (interaction.deferred === false) await interaction.deferReply();

        const message = await interaction.editReply({
            embeds: [embeds[page]],
            components: [row]
        });

        const collector = message.createMessageComponentCollector({
            filter: (i) =>
                i.customId === "previous_page" || i.customId === "next_page",
            time: 60000
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

    private setup = () =>
        Weapons.forEach((weapon) => this.list.set(weapon.id, weapon));
}
