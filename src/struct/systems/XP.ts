import { User } from "discord.js";

import { Container } from "@sapphire/pieces";

export default class XP {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    calculateLevel = (xp: number) => Math.floor(0.1 * Math.sqrt(xp));

    async giveXP(user: User, amount = 1) {
        const { database } = this.container;

        const db = await database.users.get(user);

        db.xp += amount;
        await db.save();
    }

    async setLevel(user: User, level: number) {
        const { database } = this.container;

        const db = await database.users.get(user);

        db.level = level;
        await db.save();
    }

    async levelUp(user: User) {
        const { database } = this.container;

        const db = await database.users.get(user);

        db.level += 1;
        await db.save();
    }

    async getXP(user: User) {
        const { database } = this.container;

        const db = await database.users.get(user);

        return db.xp;
    }

    async getLevel(user: User) {
        const { database } = this.container;

        const db = await database.users.get(user);

        return db.level;
    }

    calculateXPForLevel(level: number) {
        let xp = 0;
        let currentLevel = 0;

        while (currentLevel !== level) {
            xp++;
            currentLevel = this.calculateLevel(xp);
        }

        return xp;
    }

    calculateReqXP = (level: number) => level * level * 100 + 100;
}
