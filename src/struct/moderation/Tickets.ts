import { Container } from "@sapphire/pieces";
import { CommandInteraction, OverwriteResolvable } from "discord.js";

export default class Tickets {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async addButton(interaction: CommandInteraction<"cached">) {
        const { options, guild } = interaction;

        const db = await this.container.database.guilds.get(guild);
        if (!db) return;

        await interaction.deferReply({ ephemeral: true });

        if (!db.tickets.channels.openTicket)
            return interaction.editReply({
                content: "Set up your `Open Ticket` channel first"
            });

        const text = options.getString("text", true);
        const style = options.getNumber("style", true);
        const emoji = options.getString("emoji");
        const id = text.toLowerCase().split(" ").join("-").concat("_ticket");

        const channel = guild.channels.cache.get(
            db.tickets.channels.openTicket
        );

        if (!channel || !channel.isText()) return;

        const message = (await channel.messages.fetch()).get(
            db.tickets.message
        );

        if (!message)
            return interaction.editReply({ content: "Message not found" });

        if (message.components.length === 5)
            return interaction.editReply({
                content: "Delete some buttons before adding a new one"
            });

        const button = this.container.util
            .button()
            .setCustomId(id)
            .setLabel(text)
            .setStyle(style) as any;

        if (emoji) button.setEmoji(emoji);

        try {
            const latestRow = message.components.at(-1) as any;
            if (!latestRow) {
                const row = this.container.util
                    .row()
                    .addComponents(button) as any;
                message.components.push(row);

                await message.edit({ components: [row] });

                db.tickets.buttons.push(id);

                await db.save();

                return interaction.editReply({
                    content: "First button added",
                    components: [
                        this.container.util.row().setComponents(button)
                    ]
                });
            }

            if (latestRow.components.length === 5) {
                const newRow = this.container.util
                    .row()
                    .addComponents(button) as any;
                message.components.push(newRow);
            }

            if (latestRow.components.length < 5) {
                latestRow.components.push(button);
            }

            await message.edit({ components: message.components });

            db.tickets.buttons.push(id);

            await db.save();

            return interaction.editReply({
                content: "New button added",
                components: [this.container.util.row().setComponents(button)]
            });
        } catch (err: any) {
            if (err.message.includes("duplicated"))
                return interaction.editReply({
                    content: "Button with the similar name already exists"
                });

            return interaction.editReply({
                content: "An error occured"
            });
        }
    }

    async removeButton(interaction: CommandInteraction<"cached">) {
        const { options, guild } = interaction;

        const id = options.getString("id", true);
        const db = await this.container.database.guilds.get(guild);
        if (!db) return;

        const channel = guild.channels.cache.get(
            db.tickets.channels.openTicket
        );

        if (!channel)
            return interaction.reply({
                content: "Channel not found",
                ephemeral: true
            });

        if (!channel.isText()) return;

        const message = channel.messages.cache.get(db.tickets.message);

        if (!message)
            return interaction.reply({
                content: "Message not found",
                ephemeral: true
            });

        const row = message.components.find((r) =>
            r.components.find((btn) => btn.customId === id)
        ) as any;

        if (row.components.length < 2) {
            await message.edit({
                components: message.components.filter((r) =>
                    r.components.find((btn) => btn.customId !== id)
                )
            });
        } else {
            row.components = row.components.filter(
                (btn: any) => btn.customId !== id
            );

            await message.edit({ components: message.components });
        }

        db.tickets.buttons = db.tickets.buttons.filter(
            (button) => button !== id
        );

        await db.save();

        return interaction.reply({
            content: "Removed a button",
            ephemeral: true
        });
    }

    async resetButtons(interaction: CommandInteraction<"cached">) {
        const { guild } = interaction;

        const db = await this.container.database.guilds.get(guild);
        if (!db) return;

        const channel = guild.channels.cache.get(
            db.tickets.channels.openTicket
        );

        if (!channel)
            return interaction.reply({
                content: "Channel not found",
                ephemeral: true
            });

        if (!channel.isText()) return;

        const message = channel.messages.cache.get(db.tickets.message);

        if (message) await message.edit({ components: [] });

        db.tickets.buttons = [];

        await db.save();

        return interaction.reply({
            content: "Reset the buttons",
            ephemeral: true
        });
    }

    async editDescription(interaction: CommandInteraction<"cached">) {
        const { options, guild } = interaction;

        const db = await this.container.database.guilds.get(guild);
        if (!db) return;

        if (!db.tickets.category)
            return interaction.reply({
                content: "Ticket system is not setup",
                ephemeral: true
            });

        const description = options.getString("desc", true);

        const channel = guild.channels.cache.get(
            db.tickets.channels.openTicket
        );
        if (!channel)
            return interaction.reply({
                content: "Open Ticket channel is incorrectly setup",
                ephemeral: true
            });
        if (!channel.isText()) return;

        const message = (await channel.messages.fetch()).get(
            db.tickets.message
        );
        if (!message)
            return interaction.reply({
                content: `Could not find Ticket Message in channel ${channel}`,
                ephemeral: true
            });

        const embed = this.container.util.embed().setDescription(description);

        await message.edit({ embeds: [embed] });

        return interaction.reply({
            content: `Description edited to \`${description}\``,
            ephemeral: true
        });
    }

    async autoSetup(interaction: CommandInteraction<"cached">) {
        const { guild } = interaction;

        if (!guild.me?.permissions.has("MANAGE_CHANNELS"))
            return interaction.reply({
                content: "Bot missing permissions `ManageChannels`",
                ephemeral: true
            });

        await interaction.deferReply({ ephemeral: true });

        const db = await this.container.database.guilds.get(guild);
        if (!db) return;

        const setupEmbed = this.container.util
            .embed()
            .setTitle("Ticket System Auto Setup");

        const category = await guild.channels.create("Ticket System", {
            type: "GUILD_CATEGORY",
            position: 0
        });

        setupEmbed.setDescription("✅ Category created");

        await interaction.editReply({
            embeds: [setupEmbed]
        });

        const openTicket = await guild.channels.create("open-ticket", {
            parent: category,
            type: "GUILD_TEXT",
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ["SEND_MESSAGES"],
                    allow: ["USE_APPLICATION_COMMANDS"]
                }
            ]
        });

        await interaction.editReply({
            embeds: [
                setupEmbed.setDescription(
                    setupEmbed.description +
                        `\n✅ Open Ticket channel created: ${openTicket}`
                )
            ]
        });

        const transcriptPerms: OverwriteResolvable[] = guild.roles.cache.map(
            (role) =>
                role.permissions.has("MODERATE_MEMBERS")
                    ? {
                          id: role.id,
                          allow: [
                              "VIEW_CHANNEL",
                              "SEND_MESSAGES",
                              "READ_MESSAGE_HISTORY"
                          ]
                      }
                    : {
                          id: role.id,
                          allow: [
                              "VIEW_CHANNEL",
                              "SEND_MESSAGES",
                              "READ_MESSAGE_HISTORY"
                          ]
                      }
        );

        const transcripts = await guild.channels.create("transcripts", {
            parent: category,
            type: "GUILD_TEXT",
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [
                        "VIEW_CHANNEL",
                        "SEND_MESSAGES",
                        "READ_MESSAGE_HISTORY"
                    ]
                },
                ...transcriptPerms
            ]
        });

        await interaction.editReply({
            embeds: [
                setupEmbed.setDescription(
                    setupEmbed.description +
                        `\n✅ Transcripts channel created: ${transcripts}`
                )
            ]
        });

        (db.tickets.category = category.id),
            (db.tickets.channels.openTicket = openTicket.id),
            (db.tickets.channels.transcripts = transcripts.id);

        const embed = this.container.util
            .embed()
            .setDescription(
                "Use </tickets description:1013962963989831685> to change this description\nUse </tickets buttons add:1013962963989831685> to add buttons\nUse </tickets buttons remove:1013962963989831685> to remove buttons"
            );

        const message = await openTicket.send({ embeds: [embed] });

        db.tickets.message = message.id;

        await db.save();

        return interaction.editReply({
            embeds: [
                setupEmbed.setDescription(
                    setupEmbed.description + "\n\nTicket System Setup finished"
                )
            ]
        });
    }
}
