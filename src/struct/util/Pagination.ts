import { Container } from "@sapphire/pieces";
import Util from ".";

import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    ButtonStyle
} from "discord.js";

export default class UtilPagination {
    private readonly container: Container;
    private readonly util: Util;

    constructor(container: Container, util: Util) {
        this.container = container;
        this.util = util;
    }

    async default(
        interaction:
            | ButtonInteraction<"cached">
            | ChatInputCommandInteraction<"cached">,
        contents: string[] | string[][],
        title?: string,
        ephemeral = false,
        timeout = 12000
    ) {
        let page = 0;

        const buttons = [
            this.util
                .button()
                .setCustomId("previous_page")
                .setEmoji("⬅️")
                .setStyle(ButtonStyle.Secondary),
            this.util
                .button()
                .setCustomId("next_page")
                .setEmoji("➡️")
                .setStyle(ButtonStyle.Secondary)
        ];

        const row = this.util.row().addComponents(buttons);

        const embeds = contents.map((content, index) => {
            const embed = this.util.embed();
            if (typeof content == "object") {
                embed.setDescription(content.join("\n"));
            } else {
                embed.setDescription(content);
            }

            embed.setFooter({
                text: `Page ${index + 1} of ${contents.length}`
            });
            if (title) embed.setTitle(title);

            return embed;
        });

        if (!interaction.deferred) await interaction.deferReply({ ephemeral });

        const message = await interaction.editReply({
            embeds: [embeds[page]],
            components: embeds.length < 2 ? [] : [row]
        });

        const collector = message.createMessageComponentCollector({
            filter: (i) =>
                i.customId === "previous_page" || i.customId === "next_page",
            time: timeout
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
                if (
                    reason !== "messageDelete" &&
                    !ephemeral &&
                    embeds.length < 2
                ) {
                    const disabledRow = this.util
                        .row()
                        .addComponents(
                            buttons[0].setDisabled(true),
                            buttons[1].setDisabled(true)
                        );

                    message.edit({
                        embeds: [embeds[page]],
                        components: embeds.length < 2 ? [] : [disabledRow]
                    });
                }
            });
    }
}
