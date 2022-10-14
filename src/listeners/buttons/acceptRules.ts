import { Listener } from "@sapphire/framework";
import { ButtonInteraction } from "discord.js";

export class AcceptRulesBtnListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Accept Rules Button",
            event: "interactionCreate"
        });
    }

    public async run(interaction: ButtonInteraction<"cached">) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== "accept_rules") return;

        const { database } = this.container;
        const { guild, member } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        if (!db.roles.member || db.roles.member.length < 1)
            return interaction.reply({
                content: "Member is not setup, Contact the server owner",
                ephemeral: true
            });

        const role = guild.roles.cache.get(db.roles.member);
        if (!role)
            return interaction.reply({
                content: "Member role not found",
                ephemeral: true
            });

        if (member.roles.cache.get(role.id))
            return interaction.reply({
                content: "You already a member",
                ephemeral: true
            });

        member.roles.add(role);

        return interaction.reply({
            content:
                "You accepted the rules and became a member, have a good stay",
            ephemeral: true
        });
    }
}
