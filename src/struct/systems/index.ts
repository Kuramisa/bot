import { Container } from "@sapphire/pieces";

import Crypt from "./Crypt";
import Music from "./Music";
import Patreon from "./patreon";
import Playlist from "./Playlist";
import XP from "./XP";

export default class Systems {
    readonly crypt: Crypt;
    readonly music: Music;
    readonly patreon: Patreon;
    readonly playlist: Playlist;
    readonly xp: XP;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;

        this.crypt = new Crypt();
        this.music = new Music(this.container);
        this.patreon = new Patreon(this.container);
        this.playlist = new Playlist(this.container);
        this.xp = new XP(this.container);
    }
}
