import { Subcommand } from "@sapphire/plugin-subcommands";

import toHex from "colornames";
import fromHex from "color-namer";
import isHexColor from "is-hex-color";
import { ChatInputCommandInteraction } from "discord.js";

export class CardCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "card",
            description: "Customize your profile card",
        });
    }

    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommandGroup((group) =>
                    group
                        .setName("background")
                        .setDescription("Change your background")
                        .addSubcommand((command) =>
                            command
                                .setName("banner")
                                .setDescription(
                                    "Uses your banner as a background"
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("color")
                                .setDescription(
                                    "Use a color for your background"
                                )
                                .addStringOption((option) =>
                                    option
                                        .setName("color")
                                        .setDescription("Color to set it to")
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("image")
                                .setDescription("Use an image as a background")
                                .addAttachmentOption((option) =>
                                    option
                                        .setName("background_image")
                                        .setDescription("Background image")
                                )
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("outlines")
                        .setDescription("Change your outline colors")
                        .addSubcommand((command) =>
                            command
                                .setName("banner")
                                .setDescription("Uses your banner's colors")
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("avatar")
                                .setDescription("Uses your avatar's colors")
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("color")
                                .setDescription("Use a color for your outlines")
                                .addStringOption((option) =>
                                    option
                                        .setName("color")
                                        .setDescription("Color to set it to")
                                )
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("text")
                        .setDescription("Change your text colors")
                        .addSubcommand((command) =>
                            command
                                .setName("banner")
                                .setDescription("Uses your banner's colors")
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("avatar")
                                .setDescription("Uses your avatar's colors")
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("color")
                                .setDescription("Use a color for your text")
                                .addStringOption((option) =>
                                    option
                                        .setName("color")
                                        .setDescription("Color to set it to")
                                )
                        )
                )
        );
    }

    async chatInputRun(
        interaction: ChatInputCommandInteraction<"cached">
    ): Promise<any> {
        const { database, util } = this.container;

        const { options, user } = interaction;

        await user.fetch();

        const db = await database.users.get(user);
        if (!db) return;

        switch (options.getSubcommandGroup()) {
            case "background": {
                switch (options.getSubcommand()) {
                    case "banner": {
                        if (db.card.background.type === "banner")
                            return interaction.reply({
                                content:
                                    "Your background is already using your banner",
                                ephemeral: true,
                            });

                        const banner = user.banner;
                        if (!banner)
                            return interaction.reply({
                                content: "You don't have a banner",
                                ephemeral: true,
                            });
                        db.card.background.type = "banner";

                        await db.save();

                        return interaction.reply({
                            content:
                                "Your background will be your banner from now on",
                            ephemeral: true,
                        });
                    }
                    case "color": {
                        const color = options.getString("color");
                        db.card.background.type = "color";

                        if (!color) {
                            await db.save();
                            const colorName = fromHex(db.card.background.color)
                                .basic[0].name;

                            return interaction.reply({
                                content: `Switched the background to a color, **Current Color**: ${colorName}`,
                                ephemeral: true,
                            });
                        }
                        let hex = color;
                        if (!isHexColor(color)) hex = toHex(color) as string;

                        if (!hex)
                            return interaction.reply({
                                content: `${color} is not a color`,
                                ephemeral: true,
                            });

                        db.card.background.color = hex;

                        await db.save();

                        return interaction.reply({
                            content: `Your background was changed to **${color}** `,
                            ephemeral: true,
                        });
                    }
                    case "image": {
                        const attachment =
                            options.getAttachment("background_image");

                        db.card.background.type = "image";

                        await interaction.deferReply({ ephemeral: true });

                        if (!attachment) {
                            if (!db.card.background.image) {
                                await interaction.editReply({
                                    content:
                                        "You don't have any images uploaded as your background before",
                                });

                                return;
                            }

                            const newAttachment = util.attachment(
                                db.card.background.image,
                                "current_image.png"
                            );

                            await db.save();

                            await interaction.editReply({
                                files: [newAttachment],
                                content:
                                    "Switched the background to an image, **Current image below**",
                            });

                            return;
                        }
                        if (
                            !attachment.contentType?.includes("image") ||
                            attachment.contentType === "image/gif"
                        ) {
                            await interaction.editReply({
                                content: "File has to be an image",
                            });

                            return;
                        }

                        db.card.background.image = await util.imageToBuffer(
                            attachment.url
                        );

                        await db.save();

                        await interaction.editReply({
                            files: [attachment],
                            content:
                                "Your background was changed to ***Image below***",
                        });

                        return;
                    }
                }
                break;
            }
            case "outlines": {
                switch (options.getSubcommand()) {
                    case "banner": {
                        const banner = user.banner;
                        if (!banner)
                            return interaction.reply({
                                content: "You don't have a banner",
                                ephemeral: true,
                            });

                        db.card.outlines.type = "banner";

                        await db.save();

                        return interaction.reply({
                            content:
                                "Your outlines are now using your banner's colors",
                            ephemeral: true,
                        });
                    }
                    case "avatar": {
                        const avatar = user.avatar;
                        if (!avatar)
                            return interaction.reply({
                                content: "You don't have an avatar",
                                ephemeral: true,
                            });

                        db.card.outlines.type = "avatar";

                        await db.save();

                        return interaction.reply({
                            content:
                                "Your outlines are now using your avatar's colors",
                            ephemeral: true,
                        });
                    }
                    case "color": {
                        const color = options.getString("color");

                        db.card.outlines.type = "color";

                        if (!color) {
                            await db.save();
                            const colorName = fromHex(db.card.outlines.color)
                                .basic[0].name;
                            return interaction.reply({
                                content: `Switched the outlines to a color, **Current Color**: ${colorName}`,
                                ephemeral: true,
                            });
                        }

                        let hex = color;
                        if (!isHexColor(color)) hex = toHex(color) as string;
                        if (!hex)
                            return interaction.reply({
                                content: `${color} is not a color`,
                                ephemeral: true,
                            });

                        db.card.outlines.color = hex;

                        await db.save();

                        return interaction.reply({
                            content: `Your outlines was changed to **${color}**`,
                            ephemeral: true,
                        });
                    }
                }
                break;
            }
            case "text": {
                switch (options.getSubcommand()) {
                    case "banner": {
                        const banner = user.banner;
                        if (!banner)
                            return interaction.reply({
                                content: "You don't have a banner",
                                ephemeral: true,
                            });
                        db.card.text.type = "banner";

                        await db.save();

                        return interaction.reply({
                            content:
                                "Your text is now using your banner's colors",
                            ephemeral: true,
                        });
                    }
                    case "avatar": {
                        const avatar = user.avatar;
                        if (!avatar)
                            return interaction.reply({
                                content: "You don't have an avatar",
                                ephemeral: true,
                            });

                        db.card.text.type = "avatar";

                        await db.save();

                        return interaction.reply({
                            content:
                                "Your text is now using your avatar's colors",
                            ephemeral: true,
                        });
                    }
                    case "color": {
                        const color = options.getString("color");
                        db.card.text.type = "color";

                        if (!color) {
                            await db.save();
                            const colorName = fromHex(db.card.outlines.color)
                                .basic[0].name;
                            return interaction.reply({
                                content: `Switched the text to a color, **Current Color**: ${colorName}`,
                                ephemeral: true,
                            });
                        }

                        let hex = color;
                        if (!isHexColor(color)) hex = toHex(color) as string;
                        if (!hex)
                            return interaction.reply({
                                content: `${color} is not a color`,
                                ephemeral: true,
                            });

                        db.card.text.color = hex;

                        await db.save();

                        return interaction.reply({
                            content: `Your text was changed to **${color}**`,
                            ephemeral: true,
                        });
                    }
                }
                break;
            }
        }
    }
}
