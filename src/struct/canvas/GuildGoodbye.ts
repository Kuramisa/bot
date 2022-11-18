import { Container } from "@sapphire/pieces";
import { Presence, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { Canvas as CanvasM, loadImage } from "skia-canvas";
import Canvas from ".";

import toHex from "colornames";
import fromHex from "color-namer";
import isHexColor from "is-hex-color";

export default class GuildGoodbye {
    private readonly container: Container;
    private readonly canvas: Canvas;

    constructor(container: Container, canvas: Canvas) {
        this.container = container;
        this.canvas = canvas;
    }

    async banner(interaction: ChatInputCommandInteraction<"cached">) {
        const { database } = this.container;

        const { guild } = interaction;
        if (!guild) return;
        const db = await database.guilds.get(guild);
        if (!db) return;

        if (!guild.banner)
            return interaction.reply({
                content: "Server does not have a banner",
                ephemeral: true
            });

        db.goodbyeMessage.card.type = "banner";

        await db.save();

        return interaction.reply({
            content: "Set the background to server's banner",
            ephemeral: true
        });
    }

    async icon(interaction: ChatInputCommandInteraction<"cached">) {
        const { database } = this.container;

        const { guild } = interaction;
        if (!guild) return;
        const db = await database.guilds.get(guild);
        if (!db) return;

        if (!guild.icon)
            return interaction.reply({
                content: "Server does not have an icon",
                ephemeral: true
            });

        db.goodbyeMessage.card.type = "icon";

        await db.save();

        return interaction.reply({
            content: "Set the background to server's icon",
            ephemeral: true
        });
    }

    async color(interaction: ChatInputCommandInteraction<"cached">) {
        const { database } = this.container;

        const { guild, options } = interaction;
        if (!guild) return;
        const db = await database.guilds.get(guild);
        if (!db) return;

        const color = options.getString("color");

        db.goodbyeMessage.card.type = "color";

        if (!color) {
            await db.save();
            const colorName = fromHex(db.goodbyeMessage.card.color).basic[0]
                .name;

            return interaction.reply({
                content: `Set the background to ${colorName}`,
                ephemeral: true
            });
        }

        let hex = color;
        if (!isHexColor(color)) hex = toHex(color) as string;

        if (!hex)
            return interaction.reply({
                content: `${color} is not a color`,
                ephemeral: true
            });

        db.goodbyeMessage.card.color = hex;

        await db.save();

        return interaction.reply({
            content: `Set the background to **${color}** `,
            ephemeral: true
        });
    }

    async image(interaction: ChatInputCommandInteraction<"cached">) {
        const { database } = this.container;

        const { guild, options } = interaction;
        if (!guild) return;
        const db = await database.guilds.get(guild);
        if (!db) return;

        await interaction.deferReply({ ephemeral: true });

        const attachment = options.getAttachment("image");

        db.goodbyeMessage.card.type = "image";

        if (!attachment) {
            if (!db.goodbyeMessage.card.image)
                return interaction.editReply({
                    content:
                        "You don't have any images uploaded as your background before"
                });

            const newAttachment = this.container.util.attachment(
                db.goodbyeMessage.card.image,
                "current_image.png"
            );

            await db.save();

            return interaction.editReply({
                content: "Switched the background to an image",
                files: [newAttachment]
            });
        }

        if (
            !attachment.contentType?.includes("image") ||
            attachment.contentType === "image/gif"
        )
            return interaction.editReply({
                content: "File has to be a static image"
            });

        const imageBuffer = await this.container.util.imageToBuffer(
            attachment.url
        );

        db.goodbyeMessage.card.image = imageBuffer;

        await db.save();

        return interaction.editReply({
            content: "Set custom image as the background",
            files: [attachment]
        });
    }

    async imageURL(interaction: ChatInputCommandInteraction<"cached">) {
        const { database, util } = this.container;

        const { guild, options } = interaction;
        if (!guild) return;
        const db = await database.guilds.get(guild);
        if (!db) return;

        await interaction.deferReply({ ephemeral: true });

        const url = options.getString("url");

        db.goodbyeMessage.card.type = "image";

        if (!url) {
            if (!db.goodbyeMessage.card.image)
                return interaction.editReply({
                    content:
                        "You do not have any images saved to use as the background"
                });

            const newAttachment = this.container.util.attachment(
                db.goodbyeMessage.card.image,
                "current_image.png"
            );

            await db.save();

            return interaction.editReply({
                content: "Switched the background to an image",
                files: [newAttachment]
            });
        }

        db.goodbyeMessage.card.image = url;

        await db.save();

        const attachment = util.attachment(url);

        return interaction.editReply({
            content: "Set custom image URL as the background",
            files: [attachment]
        });
    }

    async channel(interaction: ChatInputCommandInteraction<"cached">) {
        const { database } = this.container;

        const { guild, options } = interaction;
        if (!guild) return;
        const db = await database.guilds.get(guild);
        if (!db) return;

        const channel = options.getChannel("text_channel", true);

        db.goodbyeMessage.channel = channel.id;

        await db.save();

        return interaction.reply({
            content: `Set ${channel} as welcome message channel`,
            ephemeral: true
        });
    }

    async toggle(interaction: ChatInputCommandInteraction<"cached">) {
        const { database } = this.container;

        const { guild } = interaction;
        if (!guild) return;
        const db = await database.guilds.get(guild);
        if (!db) return;

        db.goodbyeMessage.enabled = !db.goodbyeMessage.enabled;

        await db.save();

        const stateText = db.goodbyeMessage.enabled ? "Enabled" : "Disabled";

        return interaction.reply({
            content: `Welcome Message was **${stateText}**`,
            ephemeral: true
        });
    }

    async card(member: GuildMember) {
        const { database, util } = this.container;

        await member.user.fetch();

        const canvas = new CanvasM(1024, 450);
        const ctx = canvas.getContext("2d");

        const guild = await member.guild.fetch();

        const db = await database.guilds.get(guild);
        if (!db) return;

        const settings = db.goodbyeMessage;

        let background;

        ctx.filter = "blur(6px)";
        switch (settings.card.type) {
            case "banner": {
                background = await loadImage(
                    guild.bannerURL({ extension: "png" }) as string
                );
                break;
            }
            case "icon": {
                background = await loadImage(
                    guild.iconURL({ extension: "png" }) as string
                );
                break;
            }
            case "color": {
                ctx.fillStyle = settings.card.color;
                break;
            }
            case "image": {
                background = await loadImage(settings.card.image);
                break;
            }
        }

        if (!background) ctx.fillRect(0, 0, canvas.width, canvas.height);
        else ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        ctx.filter = "none";

        const memberColor = member.user.hexAccentColor
            ? member.user.hexAccentColor
            : "#808080";
        const iconColors = await this.canvas.popularColor(
            guild.iconURL({ extension: "png" }) as string
        );
        const iconColor =
            iconColors[Math.floor(Math.random() * iconColors.length)];

        // Border Layer
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 25, canvas.height);
        ctx.fillRect(canvas.width - 25, 0, 25, canvas.height);
        ctx.fillRect(25, 0, canvas.width - 50, 25);
        ctx.fillRect(25, canvas.height - 25, canvas.width - 50, 25);

        // Username
        ctx.globalAlpha = 1;
        ctx.fillStyle = "white";
        ctx.strokeStyle = memberColor;
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.font = this.canvas.applyText(
            canvas,
            member.user.tag,
            48,
            500,
            "Coffee"
        );
        ctx.strokeText(member.user.tag, canvas.width / 2, 255);
        ctx.fillText(member.user.tag, canvas.width / 2, 255);

        // Title
        ctx.font = "Coffee 60px";
        ctx.strokeText("Welcome to", canvas.width / 2, canvas.height - 125);
        ctx.fillText("Welcome to", canvas.width / 2, canvas.height - 125);

        // Guild Name
        ctx.strokeStyle = iconColor;
        ctx.font = this.canvas.applyText(
            canvas,
            member.user.discriminator,
            53,
            750,
            "Coffee"
        );
        ctx.strokeText(guild.name, canvas.width / 2, canvas.height - 60);
        ctx.fillText(guild.name, canvas.width / 2, canvas.height - 60);

        // Avatar
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.strokeStyle = util.member.statusColor(member.presence as Presence);
        ctx.arc(canvas.width - 525, 135, 64, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();
        ctx.clip();
        const avatar = await loadImage(
            member.displayAvatarURL({ extension: "png" })
        );
        ctx.drawImage(avatar, canvas.width - 590, 70, 128, 128);

        const attachment = util.attachment(
            await canvas.toBuffer("png"),
            `farewell-${member.user.username}.png`
        );

        return attachment;
    }
}
