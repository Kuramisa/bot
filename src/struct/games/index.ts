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
}
