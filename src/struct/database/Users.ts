import { Container } from "@sapphire/pieces";
import { User as DiscordUser } from "discord.js";

import User from "#schemas/User";

export default class DatabaseUsers {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async create(user: DiscordUser) {
        const { logger } = this.container;

        logger.info(
            `User added to the Database (ID: ${user.id} - Name: ${user.tag})`
        );

        return User.create({ id: user.id, username: user.username });
    }

    async get(user: DiscordUser) {
        const db = await User.findOne({ id: user.id });
        if (!db) return this.create(user);

        return db;
    }

    getAll = async () => await User.find();
    check = async (user: DiscordUser) =>
        !!(await User.findOne({ id: user.id }));

    verify = async (user: DiscordUser) =>
        !(await this.check(user)) && this.create(user);

    verifyAll = () =>
        this.container.client.users.cache.forEach(async (user) => {
            await this.verify(user);
        });
}
