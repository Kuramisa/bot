import { Container } from "@sapphire/pieces";
import { Collection, Guild } from "discord.js";

import mc from "minecraft_head";
import crafatar from "crafatar";

import { TUser } from "#schemas/User";

export default class Minecraft {
    private readonly container: Container;

    readonly guilds: Collection<string, Guild>;

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
