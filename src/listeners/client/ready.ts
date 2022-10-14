import { Listener } from "@sapphire/framework";
import { PresenceData } from "discord.js";

export class ReadyListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            once: true,
            name: "clientReady",
            event: "ready"
        });
    }

    public async run() {
        const { container } = this;
        const { client, logger } = container;

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

        container.database.guilds.verifyAll();
        container.database.users.verifyAll();

        container.games.shinobi.players.init();

        const activities: PresenceData[] = [
            {
                status: "online",
                activities: [
                    {
                        name: `to ${client.users.cache.size} Users`,
                        type: "LISTENING"
                    }
                ]
            },
            {
                status: "online",
                activities: [
                    {
                        name: `in ${client.guilds.cache.size} Servers`,
                        type: "PLAYING"
                    }
                ]
            }
        ];

        client.user?.setPresence(
            activities[Math.floor(Math.random() * activities.length)]
        );

        setInterval(() => {
            client.user?.setPresence(
                activities[Math.floor(Math.random() * activities.length)]
            );
        }, 60000);
    }
}