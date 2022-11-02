import ShinobiGame from "..";
import { Collection, CommandInteraction } from "discord.js";
import { ShinobiVillage } from "@types";
import Villages from "./Villages";
import Shinobi from "@schemas/Shinobi";
import { Container } from "@sapphire/pieces";

export default class ShinobiVillages {
    private readonly container: Container;

    private readonly list: Collection<string, ShinobiVillage>;

    constructor(game: ShinobiGame) {
        this.container = game.container;

        this.list = new Collection();
        this.setup();
    }

    get = (id: string) => this.list.get(id);
    getAll = () => this.list;
    random = () => this.list.random();

    embed = (village: ShinobiVillage) =>
        this.container.util
            .embed()
            .setTitle(`${village.name.en} (${village.name.jp})`)
            .setDescription(village.description)
            .setThumbnail(village.icon)
            .setFooter({ text: `Population: ${village.population}` });

    async pagination(interaction: CommandInteraction<"cached">) {
        const { util } = this.container;

        const villages = this.getAll();

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

        const embeds = villages.map((village) => this.embed(village));

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
        Villages.forEach(async (village) => {
            village.population = (
                await Shinobi.find({ village: village.id })
            ).length;
            this.list.set(village.id, village);
        });
}
