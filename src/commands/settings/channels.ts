import { Command } from "@sapphire/framework";

export class ChannelsCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "channels",
            description: "Manage your channel assignment",
            requiredUserPermissions: "MANAGE_GUILD"
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(1 << 5)
                .addStringOption((option) =>
                    option
                        .setName("db_channel")
                        .setDescription("Channel in the database")
                        .setAutocomplete(true)
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("Channel to set")
                        .addChannelTypes(0)
                )
        );
    }

    async chatInputRun(interaction: Command.ChatInputInteraction<"cached">) {
        const { database, util } = this.container;

        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const type = options.getString("db_channel");
        const channel = options.getChannel("channel");

        if (!type && !channel) {
            const channels = Object.keys(db.channels)
                .map((name) => {
                    const id = db.channels[name as keyof typeof db.channels];

                    return `\`${util.capFirstLetter(name)}\`: ${
                        id ? `<#${id}>` : "Not set"
                    }`;
                })
                .join("\n")
                .trim();

            return interaction.reply({ content: channels, ephemeral: true });
        }

        if (type && !channel) {
            if (!Object.keys(db.channels).includes(type))
                return interaction.reply({
                    content: `\`${type}\` channel type was not found in the database`,
                    ephemeral: true
                });

            const channel = db.channels[type as keyof typeof db.channels];

            return interaction.reply({
                content: `\`${util.capFirstLetter(type)}\`: ${
                    channel ? `<#${channel}>` : "Not Set"
                }`,
                ephemeral: true
            });
        }

        if (!type && channel) {
            const channels = Object.keys(db.channels)
                .map((name) => {
                    const id = db.channels[name as keyof typeof db.channels];

                    return `\`${util.capFirstLetter(name)}\`: ${
                        id ? `<#${id}>` : "Not set"
                    }`;
                })
                .filter((str) => str.includes(channel.id))
                .join("\n")
                .trim();

            if (channels.length < 1)
                return interaction.reply({
                    content: `${channel} channel was not found in the database`,
                    ephemeral: true
                });

            return interaction.reply({ content: channels, ephemeral: true });
        }

        if (type && channel) {
            db.channels[type as keyof typeof db.channels] = channel.id;

            await db.save();

            return interaction.reply({
                content: `Set ${channel} as a **${util.capFirstLetter(
                    type
                )}** channel`,
                ephemeral: true
            });
        }
    }
}
