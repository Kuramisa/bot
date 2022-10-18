import { Container } from "@sapphire/pieces";

import Crypt from "./Crypt";
import Marriage from "./Marriage";
import Music from "./Music";
import Playlist from "./Playlist";
import Together from "./Together";
import XP from "./XP";

export default class Systems {
    private readonly container: Container;

    readonly crypt: Crypt;
    readonly marriage: Marriage;
    readonly music: Music;
    readonly playlist: Playlist;
    readonly together: Together;
    readonly xp: XP;

    constructor(container: Container) {
        this.container = container;

        this.crypt = new Crypt(this.container);
        this.marriage = new Marriage(this.container);
        this.music = new Music(this.container);
        this.playlist = new Playlist(this.container);
        this.together = new Together(this.container);
        this.xp = new XP(this.container);
    }
}