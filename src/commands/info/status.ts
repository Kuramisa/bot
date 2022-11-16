import { Command } from "@sapphire/framework";
import { Message, version } from "discord.js";
import os from "os";

export class StatusCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "status",
            aliases: ["bot_info"],
            description: "Status for the bot"
        });
    }

    /**
     * Register Slash Command
     */
    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
    }

    /**
     * Execute Message Command
     */
    messageRun = async (message: Message) =>
        message.reply({ embeds: [await this.generateEmbed()] });

    /**
     * Execute Slash Command
     */
    chatInputRun = async (interaction: Command.ChatInputInteraction) =>
        interaction.reply({
            embeds: [await this.generateEmbed()],
            ephemeral: true
        });

    /**
     * Generate Embed for bot status
     */

    private async generateEmbed() {
        const { client, database, util, stores } = this.container;

        await client.user?.fetch();
        await client.application?.fetch();

        const channelSize = (type: string[]) =>
            client.channels.cache.filter((channel) =>
                type.includes(channel.type)
            ).size;

        const mongoStatus = [
            "Disconnected",
            "Connected",
            "Connecting",
            "Disconnecting"
        ];

        return util
            .embed()
            .setTitle(`${client.user?.username} status`)
            .setDescription(`${client.application?.description}`)
            .setThumbnail(
                client.user?.displayAvatarURL({ dynamic: true }) as string
            )
            .addFields([
                {
                    name: "Client",
                    value: `${client.user?.tag}`,
                    inline: true
                },
                {
                    name: "Created",
                    value: `<t:${Math.floor(
                        (client.user?.createdTimestamp as number) / 1000
                    )}:R>`,
                    inline: true
                },
                {
                    name: "Verified",
                    value: client.user?.flags?.has("VERIFIED_BOT")
                        ? "Yes"
                        : "No",
                    inline: true
                },
                {
                    name: "Owners",
                    value: "Stealth and Bunzi",
                    inline: true
                },
                {
                    name: "Database",
                    value: mongoStatus[
                        database.connection.connection.readyState
                    ],
                    inline: true
                },
                {
                    name: "System",
                    value: os
                        .type()
                        .replace("Windows_NT", "Windows")
                        .replace("Darwin", "macOS"),
                    inline: true
                },
                {
                    name: "CPU Model",
                    value: os.cpus()[0].model,
                    inline: true
                },
                {
                    name: "CPU Usage",
                    value: `${(
                        process.memoryUsage().heapUsed /
                        1024 /
                        1024
                    ).toFixed(2)}%`,
                    inline: true
                },
                {
                    name: "Up Since",
                    value: `<t:${Math.floor(
                        (client.readyTimestamp as number) / 1000
                    )}:R>`,
                    inline: true
                },
                {
                    name: "Node.js",
                    value: process.version,
                    inline: true
                },
                {
                    name: "Discord.js",
                    value: version,
                    inline: true
                },
                {
                    name: "Ping",
                    value: `${client.ws.ping}ms`,
                    inline: true
                },
                {
                    name: "Commands",
                    value: `${stores.get("commands").size}`,
                    inline: true
                },
                {
                    name: "Events",
                    value: `${stores.get("listeners").size}`,
                    inline: true
                },
                {
                    name: "Users",
                    value: `${client.users.cache.size}`,
                    inline: true
                },
                {
                    name: "Text Channels",
                    value: `${channelSize(["GUILD_TEXT", "GUILD_NEWS"])}`,
                    inline: true
                },
                {
                    name: "Voice Channels",
                    value: `${channelSize([
                        "GUILD_VOICE",
                        "GUILD_STAGE_VOICE"
                    ])}`,
                    inline: true
                },
                {
                    name: "Threads",
                    value: `${channelSize([
                        "GUILD_THREAD",
                        "GUILD_NEWS_THREAD",
                        "GUILD_PUBLIC_THREAD",
                        "GUILD_PRIVATE_THREAD"
                    ])}`,
                    inline: true
                }
            ]);
    }
}
