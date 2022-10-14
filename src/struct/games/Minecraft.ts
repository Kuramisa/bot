import { Container } from "@sapphire/pieces";
import { Collection, Guild, CommandInteraction } from "discord.js";

import mc from "minecraft_head";
import crafatar from "crafatar";

import { DUser } from "@schemas/User";

export default class Minecraft {
    private readonly container: Container;

    readonly guilds: Collection<string, Guild>;

    constructor(container: Container) {
        this.container = container;
        this.guilds = new Collection();
    }

    async generateCode(db: DUser) {
        const code = Math.random().toString(36).substring(6);

        db.minecraft.code = code;

        await db.save();

        return code;
    }

    async unlinkAccounts(db: DUser) {
        db.minecraft = { code: null, username: null };

        await db.save();
    }

    async getAvatar(username: string) {
        const player = await mc.nameToUuid(username);
        return await crafatar.getAvatar(player.uuid);
    }
}
