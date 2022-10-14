import { Container } from "@sapphire/pieces";
import { User as DiscordUser } from "discord.js";

import User from "@schemas/User";

export default class DatabaseUsers {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async create(user: DiscordUser) {
        if (user.bot) return;

        console.log(
            `User added to the Database (ID: ${user.id} - Name: ${user.tag})`
        );

        return await (
            await User.create({ id: user.id, username: user.username })
        ).save();
    }

    get = async (user: DiscordUser) =>
        (await User.findOne({ id: user.id }))
            ? await User.findOne({ id: user.id })
            : await this.create(user);
    getAll = async () => await User.find();
    check = async (user: DiscordUser) =>
        (await User.findOne({ id: user.id })) ? true : false;

    verify = async (user: DiscordUser) =>
        !(await this.check(user)) && this.create(user);

    verifyAll = () =>
        this.container.client.users.cache.forEach(async (user) => {
            this.verify(user);
        });
}