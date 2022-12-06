import { Command } from "@sapphire/framework";
import { PermissionsBitField } from "discord.js";

export class AutoRoleCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "autorole",
            description: "Give a certain role on a certain event",
            requiredUserPermissions: "ManageRoles",
            requiredClientPermissions: "ManageRoles",
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(
                    PermissionsBitField.Flags.ManageRoles
                )
                .addSubcommand((command) =>
                    command
                        .setName("add")
                        .setDescription("Add a role to autorole")
                        .addRoleOption((option) =>
                            option
                                .setName("role_to_add")
                                .setDescription("Role to add to the auto role")
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("remove")
                        .setDescription("Remove a role from autorole")
                        .addStringOption((option) =>
                            option
                                .setName("role_to_remove")
                                .setDescription(
                                    "Role to remove from the auto role"
                                )
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
        );
    }

    async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const { database } = this.container;

        const { options, guild } = interaction;
        if (!guild) return;

        const db = await database.guilds.get(guild);
        if (!db) return;

        switch (options.getSubcommand()) {
            case "add": {
                const role = options.getRole("role_to_add", true);
                if (db.autorole.includes(role.id))
                    return interaction.reply({
                        content: `${role} is already added`,
                        ephemeral: true,
                    });

                db.autorole.push(role.id);
                await db.save();

                return interaction.reply({
                    content: `Added ${role} to autorole`,
                    ephemeral: true,
                });
            }
            case "remove": {
                const roleId = options.getString("role_to_remove", true);
                if (roleId.length < 1)
                    return interaction.reply({
                        content: "Role does not exist",
                        ephemeral: true,
                    });

                if (!db.autorole.includes(roleId))
                    return interaction.reply({
                        content: "Role does not exist in the database",
                        ephemeral: true,
                    });

                db.autorole = db.autorole.filter(
                    (role: string) => roleId !== role
                );
                await db.save();

                return interaction.reply({
                    content: `Removed <@&${roleId}> from the database`,
                    ephemeral: true,
                });
            }
        }
    }
}
