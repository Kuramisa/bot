import { Container } from "@sapphire/pieces";
import ShinobiGame from "..";
import { Collection, CommandInteraction } from "discord.js";
import { ShinobiClan } from "@types";

import Clans from "./Clans";
import Shinobi from "#schemas/Shinobi";

export default class ShinobiClans {
    private readonly container: Container;

    private readonly list: Collection<string, ShinobiClan>;

    constructor(game: ShinobiGame) {
        this.container = game.container;

        this.list = new Collection();
        this.setup();
    }

    get = (id: string) => this.list.get(id);
    getAll = () => this.list;
    random = () => this.list.random();

    embed = (clan: ShinobiClan) =>
        this.container.util
            .embed()
            .setTitle(clan.name)
            .setDescription(
                `
                ${clan.description}

                \`Base Chakra\`: ${clan.stats.chakra}
                \`Base Ninjutsu\`: ${clan.stats.ninjutsu}
                \`Base Genjutsu\`: ${clan.stats.genjutsu}
                \`Base Taijutsu\`: ${clan.stats.taijutsu}
                \`Base Kenjutsu\`: ${clan.stats.kenjutsu}
                `
            )
            .setThumbnail(clan.icon)
            .setFooter({ text: `Members: ${clan.members}` });

    async pagination(interaction: CommandInteraction<"cached">) {
        const { util } = this.container;

        const clans = this.getAll();

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

        const embeds = clans.map((clan) => this.embed(clan));

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
        Clans.forEach(async (clan) => {
            clan.members = (await Shinobi.find({ clan: clan.id })).length;
            this.list.set(clan.id, clan);
        });
}
