import { Subcommand } from "@sapphire/plugin-subcommands";

export class LogsCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "logs",
            description: "Configure logs for your channel",
            requiredUserPermissions: "MANAGE_GUILD"
        });
    }

    public override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(1 << 5)
                .addSubcommand((command) =>
                    command
                        .setName("channel")
                        .setDescription("Set a Channel to send logs to")
                        .addChannelOption((option) =>
                            option
                                .setName("text_channel")
                                .setDescription("Channel to set")
                                .addChannelTypes(0)
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("toggles")
                        .setDescription("Toggle certain log")
                        .addStringOption((option) =>
                            option
                                .setName("toggle")
                                .setDescription("Log Setting")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("status")
                        .setDescription("Check current status of your logs")
                )
        );
    }

    public async chatInputRun(
        interaction: Subcommand.ChatInputInteraction<"cached">
    ) {
        const { database, util } = this.container;

        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        switch (options.getSubcommand()) {
            case "channel": {
                const channel = options.getChannel("text_channel", true);

                const permissions = guild.me?.permissionsIn(channel);
                if (!permissions?.has("VIEW_CHANNEL"))
                    return interaction.reply({
                        content: "Missing permission `View Channel`",
                        ephemeral: true
                    });
                if (!permissions.has("SEND_MESSAGES"))
                    return interaction.reply({
                        content: "Missing permission `Send Messages`",
                        ephemeral: true
                    });

                db.logs.channel = channel.id;

                await db.save();

                return interaction.reply({
                    content: `Logs channel set to ${channel}`,
                    ephemeral: true
                });
            }
            case "toggles": {
                const toggle = options.getString("toggle", true);

                const oldValue = db.logs[toggle as keyof typeof db.logs]
                    ? "On"
                    : "Off";

                db.logs.types[toggle as keyof typeof db.logs.types] =
                    !db.logs.types[toggle as keyof typeof db.logs.types];

                await db.save();

                return interaction.reply({
                    content: `Old Value: **${oldValue}** - New Value: **${
                        db.logs.types[toggle as keyof typeof db.logs.types]
                            ? "On"
                            : "Off"
                    }**`,
                    ephemeral: true
                });
            }
            case "status": {
                const channel = guild.channels.cache.get(db.logs.channel);

                const toggles = Object.keys(db.logs.types).map((key) => {
                    const formatted = util.capFirstLetter(
                        key.split(/(?=[A-Z])/).join(" ")
                    );
                    const value =
                        db.logs.types[key as keyof typeof db.logs.types];

                    return `\`${formatted}\`: ${value ? "On" : "Off"}`;
                });

                const embed = util.embed().setTitle(`${guild.name} Logs Status`)
                    .setDescription(`
                    \`Channel\`: ${channel ? channel : "Not Set"}

                    ${toggles.join("\n")}
                    `);

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
}