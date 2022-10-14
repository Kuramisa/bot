import { Container } from "@sapphire/pieces";
import { Guild as DiscordGuild } from "discord.js";

import Guild from "@schemas/Guild";

export default class DatabaseGuilds {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async create(guild: DiscordGuild) {
        console.log(
            `Guild added to the database (ID: ${guild.id} - Name: ${guild.name})`
        );

        return await (
            await Guild.create({ id: guild.id, name: guild.name })
        ).save();
    }

    get = async (guild: DiscordGuild) =>
        (await Guild.findOne({ id: guild.id }))
            ? await Guild.findOne({ id: guild.id })
            : await this.create(guild);
    getAll = async () => await Guild.find();

    check = async (guild: DiscordGuild) =>
        (await Guild.findOne({ id: guild.id })) ? true : false;

    verify = async (guild: DiscordGuild) =>
        !(await this.check(guild)) && this.create(guild);

    verifyAll = () =>
        this.container.client.guilds.cache.forEach(async (guild) => {
            this.verify(guild);
        });
}
