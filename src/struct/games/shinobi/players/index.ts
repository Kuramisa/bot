import { Collection, CommandInteraction, MessageEmbed } from "discord.js";

import { Container } from "@sapphire/pieces";
import ShinobiGame from "..";
import ShinobiPlayer from "./Player";
import Shinobi from "#schemas/Shinobi";

export default class ShinobiPlayers {
    private readonly container: Container;
    readonly game: ShinobiGame;

    private readonly list: Collection<string, ShinobiPlayer>;

    constructor(game: ShinobiGame) {
        this.container = game.container;
        this.game = game;

        this.list = new Collection();
    }

    async init() {
        const { client } = this.container;

        const players = await Shinobi.find();
        players.forEach((player) => {
            if (!client.users.cache.get(player.memberId)) return;
            this.set(player.memberId, new ShinobiPlayer(this.game, player));
        });
    }

    me(interaction: CommandInteraction<"cached">) {
        const { user } = interaction;

        const player = this.get(user.id);

        if (!player)
            return interaction.reply({
                content: "You are not a shinobi",
                ephemeral: true
            });

        const embed = this.embed(player);
        if (!embed)
            return interaction.reply({
                content: "Could not fetch your Shinobi Information",
                ephemeral: true
            });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    embed(player: ShinobiPlayer) {
        const { client, util } = this.container;

        const clan = player.clan;
        const village = player.village;
        const user = client.users.cache.get(player.id);

        if (!clan || !village || !user) return;

        return util
            .embed()
            .setTitle(`${user.username}'s Shinobi Info`)
            .setDescription(
                `
                \`Born in\` ${village.name.en} (${village.name.jp})
                \`Clan\` ${clan.name}

                \`Rank\`: ${util.capFirstLetter(player.rank)}

                **Stats**
                \`XP\`: ${player.xp}
                \`Level\`: ${player.level}

                \`Ninjutsu\`: ${player.stats.ninjutsu}
                \`Genjutsu\`: ${player.stats.genjutsu}
                \`Taijutsu\`: ${player.stats.taijutsu}
                \`Kenjutsu\`: ${player.stats.kenjutsu}
            `
            )
            .setThumbnail(clan.icon);
    }

    async pagination(interaction: CommandInteraction<"cached">) {
        const { util } = this.container;

        const players = this.getAll();

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

        const embeds = players.map((player) =>
            this.embed(player)
        ) as MessageEmbed[];

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

    set = (id: string, player: ShinobiPlayer) => this.list.set(id, player);

    get = (id: string) => this.list.get(id);
    getAll = () => this.list;

    random = () => this.list.random();
    delete = (id: string) => this.list.delete(id);
}
