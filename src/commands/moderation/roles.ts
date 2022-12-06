import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";

export class RolesCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "roles",
            description: "Manage your role assignment",
            requiredUserPermissions: "ManageGuild"
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
                        .setName("db_role")
                        .setDescription("Role property in the database")
                        .setAutocomplete(true)
                )
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setDescription("Role to assign it to")
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction<"cached">) {
        const { database, util } = this.container;

        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const type = options.getString("db_role");
        const role = options.getRole("role");

        if (!type && !role) {
            const roles = Object.keys(db.roles)
                .map((name) => {
                    const id = db.roles[name as keyof typeof db.roles];

                    return `\`${util.capFirstLetter(name)}\`: ${
                        id ? `<@&${id}>` : "Not set"
                    }`;
                })
                .join("\n")
                .trim();

            return interaction.reply({ content: roles, ephemeral: true });
        }

        if (type && !role) {
            if (!Object.keys(db.roles).includes(type))
                return interaction.reply({
                    content: `\`${type}\` role type not was found in the database`,
                    ephemeral: true
                });

            const role = db.roles[type as keyof typeof db.roles];

            return interaction.reply({
                content: `\`${util.capFirstLetter(type)}\`: ${
                    role ? `<@&${role}>` : "Not Set"
                }`,
                ephemeral: true
            });
        }

        if (!type && role) {
            const roles = Object.keys(db.roles)
                .map((name) => {
                    const id = db.roles[name as keyof typeof db.roles];

                    return `\`${util.capFirstLetter(name)}\`: ${
                        id ? `<@&${id}>` : "Not set"
                    }`;
                })
                .filter((str) => str.includes(role.id))
                .join("\n")
                .trim();

            if (roles.length < 1)
                return interaction.reply({
                    content: `${role} role was not found in the database`,
                    ephemeral: true
                });

            return interaction.reply({ content: roles, ephemeral: true });
        }

        if (type && role) {
            db.roles[type as keyof typeof db.roles] = role.id;

            await db.save();

            return interaction.reply({
                content: `${role} was set to **${util.capFirstLetter(
                    type
                )}** in the database`,
                ephemeral: true
            });
        }
    }
}
