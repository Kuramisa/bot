import { Subcommand } from "@sapphire/plugin-subcommands";
import { Message } from "discord.js";

export class MinecraftCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "mc",
            aliases: ["minecraft"],
            description: "Minecraft Commands",
            subcommands: [
                {
                    name: "link",
                    messageRun: "messageLink"
                },
                {
                    name: "unlink",
                    messageRun: "messageUnlink"
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
                .addSubcommand((command) =>
                    command
                        .setName("link")
                        .setDescription(
                            "Link your minecraft account to your discord"
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("unlink")
                        .setDescription(
                            "Unlink your minecraft account from your discord"
                        )
                )
        );
    }

    /**
     * Execute Slash Commands
     */
    public async chatInputRun(interaction: Subcommand.ChatInputInteraction) {
        const { database, minecraft } = this.container;
        const { user } = interaction;

        const db = await database.users.get(user);
        if (!db) return;

        switch (interaction.options.getSubcommand()) {
            case "link": {
                if (db.minecraft.username && db.minecraft.username.length > 0)
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
                if (!db.minecraft.username || db.minecraft.username.length < 1)
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
    }

    /**
     * Execute Message Subcommand (Link)
     */
    public async messageLink(message: Message) {
        const { database, minecraft } = this.container;

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
        const { database, minecraft } = this.container;
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
