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

    async generateCode(db: TUser) {
        const code = Math.random().toString(36).substring(6);

        db.minecraft.code = code;

        await db.save();

        return code;
    }

    async generateServerCode(guild: Guild) {
        const code = Math.random().toString(36).substring(6);

        await Mc.create({
            guildId: guild.id,
            code
        });

        return code;
    }

    async unlinkServer(guild: Guild) {
        await Mc.deleteOne({ guildId: guild.id });
    }

    async unlinkAccounts(db: TUser) {
        db.minecraft = { code: null, username: null };

        await db.save();
    }

    async getAvatar(username: string) {
        const player = await mc.nameToUuid(username);
        return await crafatar.getAvatar(player.uuid);
    }
}
