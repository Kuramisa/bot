import { Command } from "@sapphire/framework";

export class TogglesCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "toggles",
            description: "Manage your toggles",
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
                        .setName("toggle")
                        .setDescription("Choose a toggle")
                        .setAutocomplete(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("state")
                        .setDescription("Toggle state")
                        .setChoices(
                            { name: "On", value: "On" },
                            { name: "Off", value: "Off" }
                        )
                )
        );
    }

    async chatInputRun(interaction: Command.ChatInputInteraction<"cached">) {
        const { database, util } = this.container;

        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const toggle = options.getString("toggle");
        const state = options.getString("state");

        if (!toggle && !state) {
            const toggles = Object.keys(db.toggles)
                .map((name) => {
                    const value = db.toggles[name as keyof typeof db.toggles];

                    return `\`${util.capFirstLetter(name)}\`: ${
                        value ? "On" : "Off"
                    }`;
                })
                .join("\n")
                .trim();

            return interaction.reply({
                content: toggles,
                ephemeral: true
            });
        }

        if (toggle && !state) {
            if (!Object.keys(db.toggles).includes(toggle))
                return interaction.reply({
                    content: `\`${toggle}\` toggle was not found in the database`,
                    ephemeral: true
                });

            const value = db.toggles[toggle as keyof typeof db.toggles];

            return interaction.reply({
                content: `\`${util.capFirstLetter(toggle)}\`: ${
                    value ? "On" : "Off"
                }`,
                ephemeral: true
            });
        }

        if (!toggle && state) {
            const toggles = Object.keys(db.toggles)
                .map((name) => {
                    const value = db.toggles[name as keyof typeof db.toggles];

                    return `\`${util.capFirstLetter(name)}\`: ${
                        value ? "On" : "Off"
                    }`;
                })
                .filter((str) => str.includes(state))
                .join("\n")
                .trim();

            if (toggles.length < 1)
                return interaction.reply({
                    content: `Couldn't find any toggles that are **${state}**`,
                    ephemeral: true
                });

            return interaction.reply({ content: toggles, ephemeral: true });
        }

        if (toggle && state) {
            db.toggles[toggle as keyof typeof db.toggles] =
                state === "On" ? true : false;

            await db.save();

            return interaction.reply({
                content: `Turned **${state}** \`${util.capFirstLetter(
                    toggle
                )}\``,
                ephemeral: true
            });
        }
    }
}
