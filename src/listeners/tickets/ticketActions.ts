import { Listener } from "@sapphire/framework";
import { ButtonInteraction, ButtonStyle } from "discord.js";
import { createTranscript, ExportReturnType } from "discord-html-transcripts";

export class TicketActionsListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Handle tickets buttons",
            event: "interactionCreate",
        });
    }

    async run(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        if (
            !["close_ticket", "lock_ticket", "unlock_ticket"].includes(
                interaction.customId
            )
        )
            return;

        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This button can only be used in a server",
                ephemeral: true,
            });

        const { database, util } = this.container;

        const { guild, message, channel, member } = interaction;

        if (!channel) return;
        if (channel.isThread()) return;

        if (!member.permissions.has("ModerateMembers"))
            return interaction.reply({
                content: "You do not have permissions to perform this action",
                ephemeral: true,
            });

        const db = await database.guilds.get(guild);

        const ticket = await database.tickets.get(channel.id);
        if (!ticket)
            return interaction.reply({
                content: "Ticket not found",
                ephemeral: true,
            });

        const embed = util
            .embed()
            .setAuthor(message.embeds[0].author)
            .setTimestamp();

        switch (interaction.customId) {
            case "lock_ticket": {
                await database.tickets.lock(channel.id);

                message.components[0].components[0] = util
                    .button()
                    .setCustomId("unlock_ticket")
                    .setLabel("Unlock")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("🔓") as any;

                embed.setDescription(`🔒 Ticket was locked by ${member}`);

                await message.edit({
                    embeds: [embed],
                    components: message.components,
                });

                await channel.permissionOverwrites.edit(ticket.memberId, {
                    SendMessages: false,
                });

                return interaction.deferUpdate();
            }
            case "unlock_ticket": {
                await database.tickets.unlock(channel.id);

                message.components[0].components[0] = util
                    .button()
                    .setCustomId("lock_ticket")
                    .setLabel("Lock")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("🔒") as any;

                embed.setDescription(`🔒 Ticket was unlocked by ${member}`);

                await message.edit({
                    embeds: [embed],
                    components: message.components,
                });

                await channel.permissionOverwrites.edit(ticket.memberId, {
                    SendMessages: true,
                });

                return interaction.deferUpdate();
            }
            case "close_ticket": {
                if (await database.tickets.isClosed(channel.id))
                    return interaction.reply({
                        content:
                            "Ticket is already closed, please wait for it to get deleted",
                        ephemeral: true,
                    });

                const transcripts = guild.channels.cache.get(
                    db.tickets.channels.transcripts
                );
                if (!transcripts)
                    return interaction.reply({
                        content: "Transcripts channel is not setup",
                        ephemeral: true,
                    });

                if (!transcripts.isTextBased()) return;

                const filename = `${ticket.type}-${ticket.ticketId}.html`;

                const transcript = await createTranscript(channel, {
                    returnType: ExportReturnType.Buffer,
                    filename,
                    poweredBy: false,
                    saveImages: true,
                });

                await database.tickets.close(channel.id);

                ticket.transcript = transcript as any;

                // Ticket Creator
                const ticketC = guild.members.cache.get(ticket.memberId);
                if (!ticketC)
                    return interaction.reply({
                        content: "Member not found",
                        ephemeral: true,
                    });

                const message = await transcripts.send({
                    embeds: [
                        embed
                            .setAuthor({
                                name: ticketC.user.tag,
                                iconURL: ticketC.displayAvatarURL({
                                    extension: "gif",
                                }),
                            })
                            .setTitle(
                                `Transcript Type: ${ticket.type}\nID: ${ticket.ticketId}`
                            ),
                    ],
                    files: [util.attachment(transcript, filename)],
                });

                setTimeout(() => channel.delete(), 5000);

                await ticket.save();

                return interaction.reply({
                    embeds: [
                        embed.setDescription(
                            `Transcript saved [here](${message.url})`
                        ),
                    ],
                });
            }
        }
    }
}
