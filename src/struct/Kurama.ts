import "@sapphire/plugin-logger/register";

import { container, LogLevel, SapphireClient } from "@sapphire/framework";
import type { Message } from "discord.js";

import logs from "@mateie/discord-logs";

import Database from "./database";
import Util from "./util";
import XP from "./systems/XP";
import Together from "./systems/Together";
import Playlists from "./systems/Playlists";
import Music from "./systems/Music";
import Minecraft from "./games/Minecraft";
import Moderation from "./moderation";
import Games from "./games";
import Crypt from "./systems/Crypt";
import Canvas from "./canvas";

export class Kurama extends SapphireClient {
    public constructor() {
        super({
            caseInsensitiveCommands: true,
            caseInsensitivePrefixes: true,
            defaultPrefix: "k!",
            intents: [
                "GUILD_BANS",
                "GUILD_INVITES",
                "GUILDS",
                "GUILD_EMOJIS_AND_STICKERS",
                "GUILD_MEMBERS",
                "GUILD_MESSAGES",
                "GUILD_VOICE_STATES",
                "GUILD_PRESENCES",
                "GUILD_INTEGRATIONS",
                "MESSAGE_CONTENT",
                "DIRECT_MESSAGES"
            ],
            loadMessageCommandListeners: true,
            loadDefaultErrorListeners: true,
            logger: {
                level:
                    process.env.NODE_ENV === "development"
                        ? LogLevel.Debug
                        : LogLevel.Info
            }
        });

        logs(this, { debug: process.env.NODE_ENV === "development" });

        container.owners = ["401269337924829186", "190120411864891392"];

        container.canvas = new Canvas(container);
        container.crypt = new Crypt(container);
        container.database = new Database(container);
        container.games = new Games(container);
        container.moderation = new Moderation(container);
        container.minecraft = new Minecraft(container);
        container.music = new Music(container);
        container.playlists = new Playlists(container);
        container.together = new Together(container);
        container.util = new Util(container);
        container.xp = new XP(container);
    }

    public override async login(token?: string) {
        await container.database.connect();
        return super.login(token);
    }

    public override async destroy() {
        await container.database.disconnect();
        return super.destroy();
    }

    public override fetchPrefix = async (message: Message) => {
        if (message.inGuild()) {
            const guild = await container.database.guilds.get(message.guild);
            if (guild && guild.prefix) return guild.prefix;

            return [this.options.defaultPrefix] as readonly string[];
        }

        return [this.options.defaultPrefix] as readonly string[];
    };
}

export default Kurama;
