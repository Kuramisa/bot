import { Subcommand } from "@sapphire/plugin-subcommands";
import { Message } from "discord.js";
import Minecraft from "@schemas/Minecraft";

export class MinecraftCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "mc",
            aliases: ["minecraft"],
            description: "Minecraft Commands",
            subcommands: [
                {
                    name: "player",
                    type: "group",
                    entries: [
                        {
                            name: "link",
                            messageRun: "messageLink"
                        },
                        {
                            name: "unlink",
                            messageRun: "messageUnlink"
                        }
                    ]
                }
            ]
        });
    }

    /**
     * Register Slash Command
     */
    public override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .addSubcommandGroup((group) =>
                    group
                        .setName("player")
                        .setDescription("Player commands for Minecraft")
                        .addSubcommand((command) =>
                            command
                                .setName("link")
                                .setDescription(
                                    "Link your Minecraft account to your Discord"
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("unlink")
                                .setDescription(
                                    "Unlink your Minecraft account from your Discord"
                                )
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("server")
                        .setDescription("Server commands for minecraft")
                        .addSubcommand((command) =>
                            command
                                .setName("link")
                                .setDescription(
                                    "Link your Minecraft server to the Discord server"
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("unlink")
                                .setDescription(
                                    "Unlink your Minecraft server from the Discord server"
                                )
                        )
                )
        );
    }

    /**
     * Execute Slash Commands
     */
    public async chatInputRun(
        interaction: Subcommand.ChatInputInteraction<"cached">
    ) {
        const {
            database,
            games: { minecraft }
        } = this.container;
        const { guild, user, options } = interaction;

        const db = await database.users.get(user);
        if (!db) return;

        switch (options.getSubcommandGroup()) {
            case "player": {
                switch (options.getSubcommand()) {
                    case "link": {
                        if (
                            db.minecraft.username &&
                            db.minecraft.username.length > 0
                        )
                            return interaction.reply({
                                content: `Your Discord account is already linked to \`${db.minecraft.username}\``,
                                ephemeral: true
                            });

                        const code = await minecraft.generateCode(db);

                        return interaction.reply({
                            content: `Code Generated: **${code}**`,
                            ephemeral: true
                        });
                    }
                    case "unlink": {
                        if (
                            !db.minecraft.username ||
                            db.minecraft.username.length < 1
                        )
                            return interaction.reply({
                                content:
                                    "You do not have your Discord account linked to any Minecraft account",
                                ephemeral: true
                            });

                        await minecraft.unlinkAccounts(db);

                        return interaction.reply({
                            content: `Unlinked your Discord account from \`${db.minecraft.username}\``,
                            ephemeral: true
                        });
                    }
                }
                break;
            }
            case "server": {
                switch (options.getSubcommand()) {
                    case "link": {
                        if (await Minecraft.findOne({ guildId: guild.id }))
                            return interaction.reply({
                                content:
                                    "This Discord server already has a Minecraft server linked to it",
                                ephemeral: true
                            });

                        const code = await minecraft.generateServerCode(guild);

                        return interaction.reply({
                            content: `Code generated: **${code}**`,
                            ephemeral: true
                        });
                    }
                    case "unlink": {
                        if (!(await Minecraft.findOne({ guildId: guild.id })))
                            return interaction.reply({
                                content:
                                    "This Discord server is not linked to any Minecraft server",
                                ephemeral: true
                            });

                        await minecraft.unlinkServer(guild);

                        return interaction.reply({
                            content: `Unlinked \`${guild.name}\` from the Minecraft server`,
                            ephemeral: true
                        });
                    }
                }
            }
        }
    }

    /**
     * Execute Message Subcommand (Link)
     */
    public async messageLink(message: Message) {
        const {
            database,
            games: { minecraft }
        } = this.container;

        const { author } = message;

        const db = await database.users.get(author);
        if (!db) return;

        if (db.minecraft.username && db.minecraft.username.length > 0)
            return message.reply(
                `Your Discord account is already linkded to \`${db.minecraft.username}\``
            );

        const code = await minecraft.generateCode(db);

        return author
            .send(`Code generated: **${code}**`)
            .catch(() =>
                message.reply(
                    "Could not send you generated code. Make sure you have your DMs open"
                )
            );
    }

    /**
     * Execute Message Subcommand (Unlink)
     */
    public async messageUnlink(message: Message) {
        const {
            database,
            games: { minecraft }
        } = this.container;
        const { author } = message;

        const db = await database.users.get(author);
        if (!db) return;

        if (!db.minecraft.username || db.minecraft.username.length < 1)
            return message.reply(
                "You do not have your Discord account linked to any Minecraft account"
            );

        await minecraft.unlinkAccounts(db);

        return message.reply(
            `Unlinked your Discord account from \`${db.minecraft.username}\``
        );
    }
}
