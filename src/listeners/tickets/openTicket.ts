import { Listener } from "@sapphire/framework";
import { ButtonInteraction, ButtonStyle, ChannelType } from "discord.js";

export class OpenTicketListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Handle opening a ticket",
            event: "interactionCreate",
        });
    }

    async run(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This button can only be used in a server",
                ephemeral: true,
            });

        const { database, util } = this.container;

        const { customId, guild, member } = interaction;

        if (!guild) return;

        const db = await database.guilds.get(guild);

        if (!db.tickets.buttons.includes(customId)) return;

        const category = guild.channels.cache.get(db.tickets.category);
        if (!category)
            return interaction.reply({
                content: "Make sure Tickets category is setup",
                ephemeral: true,
            });

        if (category.type !== ChannelType.GuildCategory) return;

        const id = Math.floor(Math.random() * 99999) + 10000;

        const type = customId.split("_ticket")[0];
        const name = type.concat(`-${id}`);

        const channel = await guild.channels.create({
            name,
            parent: category,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ["SendMessages", "ViewChannel", "ReadMessageHistory"],
                },
                {
                    id: member.id,
                    allow: [
                        "SendMessages",
                        "ViewChannel",
                        "ReadMessageHistory",
                    ],
                },
            ],
        });

        await database.tickets.create({
            id,
            guild,
            member,
            channel,
            type,
        });

        const embed = util
            .embed()
            .setAuthor({ name: `${guild.name} | Ticket: ${id}` })
            .setDescription(
                "Please wait until the staff team responds to your ticket\nButtons below are staff only"
            );

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("lock_ticket")
                    .setLabel("Lock")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("🔒"),
                util
                    .button()
                    .setCustomId("close_ticket")
                    .setLabel("Save & Close")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("💾")
            );

        await channel.send({ embeds: [embed], components: [row] });

        return interaction.reply({
            content: `Ticket Created: ${channel}`,
            ephemeral: true,
        });
    }
}
