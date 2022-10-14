import { Listener } from "@sapphire/framework";
import { ButtonInteraction } from "discord.js";
import { createTranscript } from "discord-html-transcripts";

export class TicketActionsListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Handle tickets buttons",
            event: "interactionCreate"
        });
    }

    public async run(interaction: ButtonInteraction<"cached">) {
        if (!interaction.isButton()) return;

        if (
            !["close_ticket", "lock_ticket", "unlock_ticket"].includes(
                interaction.customId
            )
        )
            return;

        const { database, util } = this.container;

        const { guild, message, channel, member } = interaction;

        if (!channel) return;
        if (channel.isThread()) return;

        if (!member.permissions.has("MODERATE_MEMBERS"))
            return interaction.reply({
                content: "You do not have permissions to perform this action",
                ephemeral: true
            });

        const db = await database.guilds.get(guild);
        if (!db) return;

        const ticket = await database.tickets.get(channel.id);
        if (!ticket)
            return interaction.reply({
                content: "Ticket not found",
                ephemeral: true
            });

        const embed = util
            .embed()
            .setAuthor(message.embeds[0].author)
            .setTimestamp();

        switch (interaction.customId) {
            case "lock_ticket": {
                await database.tickets.lock(channel.id);

                const unlockBtn = util
                    .button()
                    .setCustomId("unlock_ticket")
                    .setLabel("Unlock")
                    .setStyle("SUCCESS")
                    .setEmoji("🔓") as any;

                message.components[0].components[0] = unlockBtn;

                embed.setDescription(`🔒 Ticket was locked by ${member}`);

                await message.edit({
                    embeds: [embed],
                    components: message.components
                });

                await channel.permissionOverwrites.edit(ticket.memberId, {
                    SEND_MESSAGES: false
                });

                return interaction.deferUpdate();
            }
            case "unlock_ticket": {
                await database.tickets.unlock(channel.id);

                const lockBtn = util
                    .button()
                    .setCustomId("lock_ticket")
                    .setLabel("Lock")
                    .setStyle("SECONDARY")
                    .setEmoji("🔒") as any;

                message.components[0].components[0] = lockBtn;

                embed.setDescription(`🔒 Ticket was unlocked by ${member}`);

                await message.edit({
                    embeds: [embed],
                    components: message.components
                });

                await channel.permissionOverwrites.edit(ticket.memberId, {
                    SEND_MESSAGES: true
                });

                return interaction.deferUpdate();
            }
            case "close_ticket": {
                if (await database.tickets.isClosed(channel.id))
                    return interaction.reply({
                        content:
                            "Ticket is already closed, please wait for it to get deleted",
                        ephemeral: true
                    });

                const transcripts = guild.channels.cache.get(
                    db.tickets.channels.transcripts
                );
                if (!transcripts)
                    return interaction.reply({
                        content: "Transcripts channel is not setup",
                        ephemeral: true
                    });

                if (!transcripts.isText()) return;

                const filename = `${ticket.type}-${ticket.ticketId}.html`;

                const transcript = await createTranscript(channel, {
                    returnType: "buffer",
                    filename,
                    poweredBy: false,
                    saveImages: true
                });

                await database.tickets.close(channel.id);

                ticket.transcript = transcript;

                // Ticket Creator
                const ticketC = guild.members.cache.get(ticket.memberId);
                if (!ticketC)
                    return interaction.reply({
                        content: "Member not found",
                        ephemeral: true
                    });

                const message = await transcripts.send({
                    embeds: [
                        embed
                            .setAuthor({
                                name: ticketC.user.tag,
                                iconURL: ticketC.displayAvatarURL({
                                    dynamic: true
                                })
                            })
                            .setTitle(
                                `Transcript Type: ${ticket.type}\nID: ${ticket.ticketId}`
                            )
                    ],
                    files: [util.attachment(transcript, filename)]
                });

                setTimeout(() => channel.delete(), 5000);

                await ticket.save();

                return interaction.reply({
                    embeds: [
                        embed.setDescription(
                            `Transcript saved [here](${message.url})`
                        )
                    ]
                });
            }
        }
    }
}
