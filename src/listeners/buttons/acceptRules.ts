import { Listener } from "@sapphire/framework";
import { ButtonInteraction } from "discord.js";

export class AcceptRulesBtnListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Accept Rules Button",
            event: "interactionCreate",
        });
    }

    async run(interaction: ButtonInteraction<"cached">) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "accept_rules") return;

        const { database } = this.container;
        const { guild, member } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const { rules } = db;

        if (!rules.roles || rules.roles.length < 1) {
            if (
                member.permissions.has("ManageGuild") ||
                member.permissions.has("ManageRoles")
            )
                return interaction.reply({
                    content:
                        "Roles for the rules is not setup, since you have the `Manage Guild` or `Manage Roles` permission, you can setup the roles with `/rules roles`",
                    ephemeral: true,
                });

            return interaction.reply({
                content:
                    "Roles for the rules is not setup, please contact an admin",
                ephemeral: true,
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const neededRoles = [];

        for (const role of rules.roles) {
            if (!member.roles.cache.has(role)) neededRoles.push(role);
        }

        if (neededRoles.length < 1)
            return interaction.editReply({
                content: "You already have all the roles that rules gives out",
            });

        await member.roles.add(neededRoles);

        return interaction.editReply({
            content: `You accepted the rules, have a good stay\n\nReceived roles: ${neededRoles
                .map((r) => `<@&${r}>`)
                .join(", ")}`,
        });
    }
}
