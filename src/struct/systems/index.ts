import { Container } from "@sapphire/pieces";

import BMC from "./bmc";
import Crypt from "./Crypt";
import Giveaways from "#struct/systems/Giveaways";
import Music from "./Music";
import Playlist from "./Playlist";
import XP from "./XP";

export default class Systems {
    readonly bmc: BMC;
    readonly crypt: Crypt;
    readonly giveaways: Giveaways;
    readonly music: Music;
    readonly playlist: Playlist;
    readonly xp: XP;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;

        this.bmc = new BMC(this.container);
        this.crypt = new Crypt();
        this.giveaways = new Giveaways(this.container);
        this.music = new Music(this.container);
        this.playlist = new Playlist(this.container);
        this.xp = new XP(this.container);
    }
}
