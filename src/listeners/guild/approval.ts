import { Listener } from "@sapphire/framework";
import { ButtonInteraction } from "discord.js";

export class ServerApprovalListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Listens to the approval button",
            event: "interactionCreate",
        });
    }

    async run(interaction: ButtonInteraction<"cached">) {
        if (!interaction.isButton()) return;

        if (
            !["approve_promotion", "decline_promotion"].includes(
                interaction.customId
            )
        )
            return;

        const { client, database, owners, util } = this.container;

        const { message, member } = interaction;

        if (!owners.includes(member.id))
            return interaction.reply({
                content: "Only Bot Owners can use this button",
                ephemeral: true,
            });

        const guild = client.guilds.cache.get(
            message.embeds[0].footer?.text as string
        );

        if (!guild)
            return interaction.reply({
                content: "Guild not found",
                ephemeral: true,
            });

        const db = await database.guilds.get(guild);

        const embed = util
            .embed()
            .setTitle(message.embeds[0].title as string)
            .setTimestamp();

        switch (interaction.customId) {
            case "approve_promotion": {
                db.promoted = true;

                await db.save();

                embed.setDescription(`${member} approved the promotion`);

                await message.edit({ embeds: [embed], components: [] });

                return interaction.deferUpdate();
            }
            case "decline_promotion": {
                db.promoted = false;

                await db.save();

                embed.setDescription(`${member} declined the promotion`);

                await message.edit({ embeds: [embed], components: [] });

                return interaction.deferUpdate();
            }
        }
    }
}
