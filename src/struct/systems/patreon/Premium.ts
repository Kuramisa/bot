import { Container } from "@sapphire/pieces";
import { Patreon as PatreonAPI } from "@anitrack/patreon-wrapper";
import { ComponentType, GuildMember } from "discord.js";

export default class Premium {
    private readonly container: Container;
    private readonly api: typeof PatreonAPI;

    constructor(container: Container, api: typeof PatreonAPI) {
        this.container = container;
        this.api = api;
    }

    async checkServers() {
        const { client, database, util } = this.container;

        const patreons = (
            await this.api.FetchPatrons(["active_patron", "declined_patron"])
        ).filter(
            (pat) =>
                pat.subscription.currentEntitled.tier.id === "9188426" &&
                pat.mediaConnection.discord.id !== null
        );

        if (patreons.length < 1) return;

        const owners: GuildMember[] = [];

        for (let i = 0; i < client.guilds.cache.size; i++) {
            const guild = client.guilds.cache.toJSON()[i];
            if (
                patreons.some(
                    (pat) => pat.mediaConnection.discord.id === guild.ownerId
                )
            ) {
                if (!owners.some((owner) => owner.id === guild.ownerId))
                    owners.push(await guild.fetchOwner());
            }
        }

        for (let i = 0; i < owners.length; i++) {
            const owner = owners[i];
            const patreon = patreons.find(
                (pat) => pat.mediaConnection.discord.id === owner.id
            );
            if (!patreon) continue;
            const ownedGuilds = client.guilds.cache.filter(
                (guild) => guild.ownerId === owner.id
            );

            const guildsOpts: { label: string; value: string }[] = [];

            for (let j = 0; j < ownedGuilds.size; j++) {
                const guild = ownedGuilds.toJSON()[j];
                const db = await database.guilds.get(guild);
                if (!db) continue;
                if (
                    patreon.subscription.currentEntitled.status ===
                        "declined_patron" &&
                    db.premium === true
                ) {
                    db.premium = false;
                    await db.save();

                    await owner.send(
                        `It seems that you have cancelled the Server Premium subscription on Patreon. Premium will be disabled for ${guild.name}`
                    );

                    continue;
                }
                if (db.premium) break;
                guildsOpts.push({ label: guild.name, value: guild.id });
            }

            if (guildsOpts.length < 1) continue;

            const row = util
                .row()
                .setComponents(
                    util
                        .dropdown()
                        .setCustomId("non_premium_servers")
                        .setMinValues(1)
                        .setMaxValues(1)
                        .setOptions(guildsOpts)
                );

            const embed = util
                .embed()
                .setAuthor({
                    name: `${client.user?.username} Server Premium Subscription`,
                })
                .setTitle(`Hello ${owner.user.tag}`)
                .setDescription(
                    "**It seems you have bought Server Premium package for Kuramisa**\n\n***Choose the server you want to give the premium to***"
                );

            const message = await owner.send({
                embeds: [embed],
                components: [row],
            });

            const guildChoice = await message.awaitMessageComponent({
                componentType: ComponentType.SelectMenu,
                filter: (i) => i.customId === "non_premium_servers",
            });

            const guild = client.guilds.cache.get(guildChoice.values[0]);
            if (!guild) continue;
            const db = await database.guilds.get(guild);
            if (!db) continue;
            db.premium = true;
            await db.save();

            await message.edit({
                embeds: [
                    embed.setDescription(
                        `${guild.name} is now a premium server`
                    ),
                ],
                components: [],
            });
        }
    }

    async checkUsers() {
        const { client, database } = this.container;

        const patreons = (
            await this.api.FetchPatrons(["active_patron", "declined_patron"])
        ).filter(
            (pat) =>
                pat.subscription.currentEntitled.tier.id === "9188414" &&
                pat.mediaConnection.discord.id !== null
        );

        if (patreons.length < 1) return;

        for (let i = 0; i < patreons.length; i++) {
            const patreon = patreons[i];
            const user = await client.users.fetch(
                `${patreon.mediaConnection.discord.id}`
            );
            const db = await database.users.get(user);
            if (!db) continue;

            if (
                patreon.subscription.currentEntitled.status ===
                    "declined_patron" &&
                db.premium === true
            ) {
                db.premium = false;
                await db.save();

                await user.send(
                    "It seems that you have cancelled the User Premium subscription on Patreon. Premium will be disabled for you"
                );
            }

            if (db.premium) continue;

            db.premium = true;

            await db.save();

            await user.send(
                "It seems you have purchased User Premium on Patreon, it will be applied to you momentarily. Thank you for supporting us :>"
            );
        }
    }
}
