import { Container } from "@sapphire/pieces";
import { Patreon as PatreonAPI } from "@anitrack/patreon-wrapper";

export default class BetaTester {
    private readonly container: Container;
    private readonly api: typeof PatreonAPI;

    constructor(container: Container, api: typeof PatreonAPI) {
        this.container = container;
        this.api = api;
    }

    async checkUsers() {
        const { client, database } = this.container;

        const patreons = (
            await this.api.FetchPatrons(["active_patron", "declined_patron"])
        ).filter(
            (pat) =>
                pat.subscription.currentEntitled.tier.id === "1231313" &&
                pat.mediaConnection.discord.id !== null
        );

        if (patreons.length < 1) return;

        for (let i = 0; i < patreons.length; i++) {
            const patreon = patreons[i];
            let user = client.users.cache.get(
                `${patreon.mediaConnection.discord.id}`
            );

            if (!user)
                user = await client.users.fetch(
                    `${patreon.mediaConnection.discord.id}`
                );

            const db = await database.users.get(user);
            if (!db) continue;

            if (
                patreon.subscription.currentEntitled.status ===
                    "declined_patron" &&
                db.betaTester === true
            ) {
                db.betaTester = false;
                await db.save();

                await user.send(
                    "It seems that you have cancelled the Beta Tester subscription on Patreon. Beta Testing will be disabled for you"
                );
            }

            if (db.betaTester) continue;

            db.betaTester = true;

            await db.save();

            await user.send(
                "It seems you have purchased Beta Tester on Patreon, it will be applied to you momentarily. Thank you for supporting us and helping us make the bot better :>"
            );
        }
    }
}
