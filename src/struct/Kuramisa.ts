import "@sapphire/plugin-logger/register";

import {container, LogLevel, SapphireClient} from "@sapphire/framework";
import {Message, Partials} from "discord.js";

import logs from "discord-logs";

import Dashboard from "./dashboard";

import Database from "./database";
import Util from "./util";
import Moderation from "./moderation";
import Games from "./games";
import Canvas from "./canvas";
import Systems from "./systems";

// TODO: Make new Profile System with new database entries
export class Kuramisa extends SapphireClient {
    constructor() {
        super({
            caseInsensitiveCommands: true,
            caseInsensitivePrefixes: true,
            defaultPrefix: "k!",
            intents: [
                "GuildBans",
                "GuildInvites",
                "Guilds",
                "GuildEmojisAndStickers",
                "GuildMessageReactions",
                "GuildMembers",
                "GuildMessages",
                "GuildVoiceStates",
                "GuildPresences",
                "GuildIntegrations",
                "MessageContent",
                "DirectMessages",
            ],
            partials: [Partials.Channel, Partials.Message, Partials.User],
            loadMessageCommandListeners: true,
            loadSubcommandErrorListeners: true,
            loadDefaultErrorListeners: true,
            logger: {
                level:
                    process.env.NODE_ENV === "development"
                        ? LogLevel.Debug
                        : LogLevel.Info,
            },
        });

        logs(this, { debug: process.env.NODE_ENV === "development" });

        container.owners = ["401269337924829186", "190120411864891392"];

        container.dashboard = new Dashboard(container);

        container.canvas = new Canvas(container);
        container.database = new Database(container);
        container.games = new Games(container);
        container.moderation = new Moderation(container);
        container.systems = new Systems(container);
        container.util = new Util(container);
    }

    override async login(token?: string) {
        await container.database.connect();
        await container.dashboard.init();
        return super.login(token);
    }

    override async destroy() {
        await container.database.disconnect();
        return super.destroy();
    }

    override fetchPrefix = async (message: Message) => {
        if (message.inGuild()) {
            const guild = await container.database.guilds.get(message.guild);
            if (guild && guild.prefix) return guild.prefix;

            return [this.options.defaultPrefix] as readonly string[];
        }

        return [this.options.defaultPrefix] as readonly string[];
    };
}

export default Kuramisa;
