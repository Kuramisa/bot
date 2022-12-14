import { Listener } from "@sapphire/framework";
import { ActivityType, PresenceData } from "discord.js";

export class ReadyListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            once: true,
            name: "clientReady",
            event: "ready",
        });
    }

    async run() {
        const { container } = this;
        const {
            client,
            database,
            systems: { bmc },
            games,
            logger,
        } = container;

        logger.info(`Ready! Logged in as ${client.user?.tag}`);

        const mainGuild = await client.guilds.fetch("814017098409443339");

        container.mainGuild = mainGuild;

        container.botLogs = await mainGuild.channels.fetch(
            "974256729661509632"
        );

        container.devReports = await container.mainGuild.channels.fetch(
            "1017711297439211521"
        );
        container.devSuggestions = await container.mainGuild.channels.fetch(
            "1019153098649915402"
        );
        container.promoteChannel = await container.mainGuild.channels.fetch(
            "1014290516764016670"
        );

        database.guilds.verifyAll();
        database.users.verifyAll();

        bmc.premium.checkServers();
        bmc.premium.checkUsers();

        await games.shinobi.players.init();

        const activities: PresenceData[] = [
            {
                status: "online",
                activities: [
                    {
                        name: `${client.users.cache.size} Users`,
                        type: ActivityType.Listening,
                    },
                ],
            },
            {
                status: "online",
                activities: [
                    {
                        name: `${client.guilds.cache.size} Servers`,
                        type: ActivityType.Watching,
                    },
                ],
            },
        ];

        client.user?.setPresence(
            activities[Math.floor(Math.random() * activities.length)]
        );

        await games.valorant.init();

        setInterval(() => {
            client.user?.setPresence(
                activities[Math.floor(Math.random() * activities.length)]
            );
        }, 60000);

        setInterval(() => {
            bmc.premium.checkServers();
            bmc.premium.checkUsers();
        }, 300000);
    }
}
