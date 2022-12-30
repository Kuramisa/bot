import { Container } from "@sapphire/pieces";
import { Collection, Guild } from "discord.js";

import mc from "minecraft_head";
import crafatar from "crafatar";

export default class Minecraft {
    readonly guilds: Collection<string, Guild>;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
        this.guilds = new Collection();
    }

    generateCode = () => Math.random().toString(36).substring(6);

    async getAvatar(username: string) {
        const player = await mc.nameToUuid(username);
        return await crafatar.getAvatar(player.uuid);
    }
}
