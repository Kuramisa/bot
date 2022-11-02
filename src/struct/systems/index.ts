import { Container } from "@sapphire/pieces";

import Crypt from "./Crypt";
import Marriage from "./Marriage";
import Music from "./Music";
import Patreon from "./patreon";
import Playlist from "./Playlist";
import XP from "./XP";

export default class Systems {
    private readonly container: Container;

    readonly crypt: Crypt;
    readonly marriage: Marriage;
    readonly music: Music;
    readonly patreon: Patreon;
    readonly playlist: Playlist;
    readonly xp: XP;

    constructor(container: Container) {
        this.container = container;

        this.crypt = new Crypt();
        this.marriage = new Marriage(this.container);
        this.music = new Music(this.container);
        this.patreon = new Patreon(this.container);
        this.playlist = new Playlist(this.container);
        this.xp = new XP(this.container);
    }
}
