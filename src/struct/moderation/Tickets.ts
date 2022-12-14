import { Container } from "@sapphire/pieces";
import {
    ChannelType,
    ChatInputCommandInteraction,
    OverwriteResolvable,
} from "discord.js";

export default class Tickets {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async addButton(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const { database, util } = this.container;

        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);

        await interaction.deferReply({ ephemeral: true });

        if (!db.tickets.channels.openTicket)
            return interaction.editReply({
                content: "Set up your `Open Ticket` channel first",
            });

        const text = options.getString("text", true);
        const style = options.getNumber("style", true);
        const emoji = options.getString("emoji");
        const id = text.toLowerCase().split(" ").join("-").concat("_ticket");

        const channel = guild.channels.cache.get(
            db.tickets.channels.openTicket
        );

        if (!channel || !channel.isTextBased()) return;

        const message = (await channel.messages.fetch()).get(
            db.tickets.message
        );

        if (!message)
            return interaction.editReply({ content: "Message not found" });

        if (message.components.length === 5)
            return interaction.editReply({
                content: "Delete some buttons before adding a new one",
            });

        const button = util
            .button()
            .setCustomId(id)
            .setLabel(text)
            .setStyle(style) as any;

        if (emoji) button.setEmoji(emoji);

        try {
            const latestRow = message.components.at(-1) as any;
            if (!latestRow) {
                const row = util.row().addComponents(button) as any;
                message.components.push(row);

                await message.edit({ components: [row] });

                db.tickets.buttons.push(id);

                await db.save();

                return interaction.editReply({
                    content: "First button added",
                    components: [util.row().setComponents(button)],
                });
            }

            if (latestRow.components.length === 5) {
                const newRow = util.row().addComponents(button) as any;
                message.components.push(newRow);
            }

            if (latestRow.components.length < 5) {
                latestRow.components.push(button);
            }

            await message.edit({ components: message.components });

            db.tickets.buttons.push(id);

            await db.save();

            return interaction.editReply({
                content: `New button added in ${channel}`,
                components: [],
            });
        } catch (err: any) {
            if (err.message.includes("duplicated"))
                return interaction.editReply({
                    content: "Button with the similar name already exists",
                });

            return interaction.editReply({
                content: "An error occurred",
            });
        }
    }

    async removeButton(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const { database } = this.container;

        const { options, guild } = interaction;

        const id = options.getString("id", true);
        const db = await database.guilds.get(guild);

        const channel = guild.channels.cache.get(
            db.tickets.channels.openTicket
        );

        if (!channel)
            return interaction.reply({
                content: "Channel not found",
                ephemeral: true,
            });

        if (!channel.isTextBased()) return;

        const message = channel.messages.cache.get(db.tickets.message);

        if (!message)
            return interaction.reply({
                content: "Message not found",
                ephemeral: true,
            });

        const row = message.components.find((r) =>
            r.components.find((btn) => btn.customId === id)
        ) as any;

        if (row.components.length < 2) {
            await message.edit({
                components: message.components.filter((r) =>
                    r.components.find((btn) => btn.customId !== id)
                ),
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
            content: `Removed a button in ${channel}`,
            ephemeral: true,
        });
    }

    async resetButtons(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const { database } = this.container;

        const { guild } = interaction;

        const db = await database.guilds.get(guild);

        const channel = guild.channels.cache.get(
            db.tickets.channels.openTicket
        );

        if (!channel)
            return interaction.reply({
                content: "Channel not found",
                ephemeral: true,
            });

        if (!channel.isTextBased()) return;

        const message = channel.messages.cache.get(db.tickets.message);

        if (message) await message.edit({ components: [] });

        db.tickets.buttons = [];

        await db.save();

        return interaction.reply({
            content: "Reset the buttons",
            ephemeral: true,
        });
    }

    async editDescription(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const { database, util } = this.container;

        const { options, guild } = interaction;

        const db = await database.guilds.get(guild);

        if (!db.tickets.category)
            return interaction.reply({
                content: "Ticket system is not setup",
                ephemeral: true,
            });

        const description = options.getString("desc", true);

        const channel = guild.channels.cache.get(
            db.tickets.channels.openTicket
        );
        if (!channel)
            return interaction.reply({
                content: "Open Ticket channel is incorrectly setup",
                ephemeral: true,
            });
        if (!channel.isTextBased()) return;

        const message = (await channel.messages.fetch()).get(
            db.tickets.message
        );
        if (!message)
            return interaction.reply({
                content: `Could not find Ticket Message in channel ${channel}`,
                ephemeral: true,
            });

        const embed = util.embed().setDescription(description);

        await message.edit({ embeds: [embed] });

        return interaction.reply({
            content: `Description edited to \`${description}\``,
            ephemeral: true,
        });
    }

    async autoSetup(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const { database, util } = this.container;

        const { guild } = interaction;

        if (!guild.members.me?.permissions.has("ManageChannels"))
            return interaction.reply({
                content: "Bot missing permissions `ManageChannels`",
                ephemeral: true,
            });

        await interaction.deferReply({ ephemeral: true });

        const db = await database.guilds.get(guild);

        const setupEmbed = util.embed().setTitle("Ticket System Auto Setup");

        const category = await guild.channels.create({
            name: "Ticket System",
            type: ChannelType.GuildCategory,
            position: 0,
        });

        setupEmbed.setDescription("??? Category created");

        await interaction.editReply({
            embeds: [setupEmbed],
        });

        const openTicket = await guild.channels.create({
            name: "open-ticket",
            parent: category,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ["SendMessages"],
                    allow: ["UseApplicationCommands"],
                },
            ],
        });

        await interaction.editReply({
            embeds: [
                setupEmbed.setDescription(
                    setupEmbed.toJSON().description +
                        `\n??? Open Ticket channel created: ${openTicket}`
                ),
            ],
        });

        const transcriptPerms: OverwriteResolvable[] = guild.roles.cache.map(
            (role) => ({
                id: role.id,
                allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
            })
        );

        const transcripts = await guild.channels.create({
            name: "transcripts",
            parent: category,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
                },
                ...transcriptPerms,
            ],
        });

        await interaction.editReply({
            embeds: [
                setupEmbed.setDescription(
                    setupEmbed.toJSON().description +
                        `\n??? Transcripts channel created: ${transcripts}`
                ),
            ],
        });

        db.tickets.category = category.id;
        db.tickets.channels.openTicket = openTicket.id;
        db.tickets.channels.transcripts = transcripts.id;

        const embed = util
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
                    setupEmbed.toJSON().description +
                        "\n\nTicket System Setup finished"
                ),
            ],
        });
    }
}
