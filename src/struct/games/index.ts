import { Container } from "@sapphire/pieces";

import Minecraft from "./Minecraft";
import Warframe from "./Warframe";
import Valorant from "./Valorant";
import ShinobiGame from "./shinobi";

import { Api as OsuApi } from "node-osu";
import SteamAPI from "steamapi";

const { OSU_API, STEAM_API } = process.env;

export default class Games {
    private readonly container: Container;

    readonly shinobi: ShinobiGame;
    readonly osu: OsuApi;
    readonly minecraft: Minecraft;
    readonly steam: SteamAPI;
    readonly warframe: Warframe;
    readonly valorant: Valorant;

    constructor(container: Container) {
        this.container = container;

        this.shinobi = new ShinobiGame(this.container);
        this.osu = new OsuApi(OSU_API as string, {
            completeScores: true,
            parseNumeric: true
        });
        this.minecraft = new Minecraft(this.container);
        this.steam = new SteamAPI(STEAM_API as string);
        this.valorant = new Valorant(this.container);
        this.warframe = new Warframe(this.container);
    }

    getChannelModals(game: string) {
        const { util } = this.container;

        const modal = util
            .modal()
            .setCustomId("channel_amounts")
            .setTitle(`Creating channels for ${game}`);

        switch (game.toLowerCase()) {
            case "valorant": {
                return modal.setComponents(
                    util
                        .modalRow()
                        .setComponents(
                            util
                                .input()
                                .setCustomId("unrated_channels")
                                .setLabel(
                                    "How many Unrated channels? (Maximum 5)"
                                )
                                .setMinLength(1)
                                .setMaxLength(1)
                                .setPlaceholder("Provide a number")
                                .setStyle("SHORT")
                        ),
                    util
                        .modalRow()
                        .setComponents(
                            util
                                .input()
                                .setCustomId("competitive_channels")
                                .setLabel(
                                    "How many Competitive channels? (Maximum 5)"
                                )
                                .setMinLength(1)
                                .setMaxLength(1)
                                .setPlaceholder("Provide a number")
                                .setStyle("SHORT")
                        ),
                    util
                        .modalRow()
                        .setComponents(
                            util
                                .input()
                                .setCustomId("custom_channels")
                                .setLabel(
                                    "How many Custom Game channels? (Maximum 5)"
                                )
                                .setMinLength(1)
                                .setMaxLength(1)
                                .setPlaceholder("Provide a number")
                                .setStyle("SHORT")
                        )
                );
            }
            case "csgo": {
                return modal.setComponents(
                    util
                        .modalRow()
                        .setComponents(
                            util
                                .input()
                                .setCustomId("unranked_channels")
                                .setLabel(
                                    "How many Unranked channels? (Maximum 5)"
                                )
                                .setMinLength(1)
                                .setMaxLength(1)
                                .setPlaceholder("Provide a number")
                                .setStyle("SHORT")
                        ),
                    util
                        .modalRow()
                        .setComponents(
                            util
                                .input()
                                .setCustomId("competitive_channels")
                                .setLabel(
                                    "How many Competitive channels? (Maximum 5)"
                                )
                                .setMinLength(1)
                                .setMaxLength(1)
                                .setPlaceholder("Provide a number")
                                .setStyle("SHORT")
                        ),
                    util
                        .modalRow()
                        .setComponents(
                            util
                                .input()
                                .setCustomId("workshop_channels")
                                .setLabel(
                                    "How many Workshop channels? (Maximum 5)"
                                )
                                .setMinLength(1)
                                .setMaxLength(1)
                                .setPlaceholder("Provide a number")
                                .setStyle("SHORT")
                        )
                );
            }
            default:
                return util.unknownModal();
        }
    }
}
