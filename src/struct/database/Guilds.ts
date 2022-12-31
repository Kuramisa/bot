import { Container } from "@sapphire/pieces";
import { Guild as DiscordGuild, OAuth2Guild } from "discord.js";

import Guild from "#schemas/Guild";

export default class DatabaseGuilds {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async create(guild: DiscordGuild | OAuth2Guild) {
        const { logger } = this.container;

        logger.info(
            `Guild added to the database (ID: ${guild.id} - Name: ${guild.name})`
        );

        return Guild.create({ id: guild.id, name: guild.name });
    }

    async get(guild: DiscordGuild | OAuth2Guild) {
        const db = await Guild.findOne({ id: guild.id });
        if (!db) return this.create(guild);

        return db;
    }

    getAll = async () => await Guild.find();

    check = async (guild: DiscordGuild | OAuth2Guild) =>
        !!(await Guild.findOne({ id: guild.id }));

    verify = async (guild: DiscordGuild | OAuth2Guild) =>
        !(await this.check(guild)) && this.create(guild);

    verifyAll = () =>
        this.container.client.guilds.cache.forEach((guild) => {
            this.verify(guild);
        });
}
