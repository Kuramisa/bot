import { Container } from "@sapphire/pieces";
import BMC from "buymeacoffee.js";

export default class Premium {
    readonly container: Container;
    readonly api: typeof BMC;

    constructor(container: Container, api: typeof BMC) {
        this.container = container;
        this.api = api;
    }

    async checkServers() {
        const { client, database } = this.container;

        const subs = (await this.api.Subscriptions()).data.filter(
            (sub: any) => sub.membership_level_id === 100259
        );

        for (const sub of subs) {
            const idRegex = new RegExp(/(?<!\d)\d{18}(?!\d)/g);
            if (!idRegex.test(sub.subscription_message)) continue;

            const possibleId = sub.subscription_message.match(idRegex)[0];

            let guild = client.guilds.cache.get(possibleId);
            if (!guild) guild = await client.guilds.fetch(possibleId);
            if (!guild) continue;

            const db = await database.guilds.get(guild);
            if (!db) continue;

            const owner = await guild.fetchOwner();

            if (sub.subscription_is_cancelled && db.premium === true) {
                db.premium = false;

                await db.save();
                await owner.send(
                    `It seems Premium subscription for your server **${guild.name}** has expired. We hope you come back to us :>`
                );
                continue;
            }

            if (db.premium) continue;

            db.premium = true;
            await db.save();
            await owner.send(
                `It seems you have purchased Premium subscription for your server **${guild.name}**. Thank you for supporting us :>`
            );
        }
    }

    async checkUsers() {
        const { client, database } = this.container;

        const subs = (await this.api.Subscriptions()).data.filter(
            (sub: any) => sub.membership_level_id === 99679
        );

        for (const sub of subs) {
            if (!sub.subscription_message) continue;

            const idRegex = new RegExp(/(?<!\d)\d{18}(?!\d)/g);
            if (!idRegex.test(sub.subscription_message)) continue;

            const possibleId = sub.subscription_message.match(idRegex)[0];

            let user = client.users.cache.get(possibleId);
            if (!user)
                user = await client.users.fetch(possibleId, { force: true });
            if (!user) continue;

            const db = await database.users.get(user);
            if (!db) continue;

            if (sub.subscription_is_cancelled && db.premium === true) {
                db.premium = false;

                await db.save();
                await user.send(
                    "It seems your User Premium subscription has been expired. We hope you come back to us :>"
                );
                continue;
            }

            if (db.premium) continue;

            db.premium = true;
            await db.save();

            await user.send(
                "It seems you have purchased User Premium, it will be applied to you momentarily. Thank you for supporting us :>"
            );
        }
    }
}
