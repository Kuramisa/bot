import { Command } from "@sapphire/framework";
import { PermissionsBitField } from "discord.js";

export class FilterCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "filter",
            description: "Filter System for your server",
            requiredUserPermissions: "ManageGuild",
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(
                    PermissionsBitField.Flags.ManageGuild
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("media")
                        .setDescription("Manage Media Filter")
                        .addSubcommand((command) =>
                            command
                                .setName("toggle")
                                .setDescription("Toggle Media Filter")
                                .addStringOption((option) =>
                                    option
                                        .setName("media_filter_toggle")
                                        .setDescription(
                                            "Enable/Disable Media Filter"
                                        )
                                        .setChoices(
                                            { name: "Enable", value: "enable" },
                                            {
                                                name: "Disable",
                                                value: "disable",
                                            }
                                        )
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("rating")
                                .setDescription("Set Media Filter Rating")
                                .addStringOption((option) =>
                                    option
                                        .setName("letter_rating")
                                        .setDescription(
                                            "Set Media Filter Rating"
                                        )
                                        .setChoices(
                                            {
                                                name: "Adult",
                                                value: "a",
                                            },
                                            {
                                                name: "Teen",
                                                value: "t",
                                            },
                                            { name: "Everyone", value: "e" }
                                        )
                                )
                        )
                )
        );
    }

    async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const { database } = this.container;

        const { guild, options } = interaction;
        if (!guild) return;

        const db = await database.guilds.get(guild);
        if (!db) return;

        switch (options.getSubcommandGroup()) {
            case "media": {
                switch (options.getSubcommand()) {
                    case "toggle": {
                        const toggle = options.getString("media_filter_toggle");

                        if (!toggle) {
                            const newValue = (db.filters.media.enabled =
                                !db.filters.media.enabled);

                            await db.save();

                            return interaction.reply({
                                content: `Media Filter has been **${
                                    newValue ? "enabled" : "disabled"
                                }**`,
                                ephemeral: true,
                            });
                        }

                        const newValue = (db.filters.media.enabled =
                            toggle === "enable" ? true : false);

                        await db.save();

                        return interaction.reply({
                            content: `Media Filter has been **${
                                newValue ? "enabled" : "disabled"
                            }**`,
                            ephemeral: true,
                        });
                    }
                    case "rating": {
                        const letterRating = options.getString("letter_rating");

                        if (!letterRating) {
                            const currentRating = db.filters.media.letter;
                            let rating = "";

                            switch (currentRating) {
                                case "a":
                                    rating = "Adult";
                                    break;
                                case "t":
                                    rating = "Teen";
                                    break;
                                case "e":
                                    rating = "Everyone";
                                    break;
                                default:
                                    rating = "Adult";
                                    break;
                            }

                            return interaction.reply({
                                content: `Media Filter Rating is currently set to **${rating}**`,
                                ephemeral: true,
                            });
                        }

                        const newLetterRating = (db.filters.media.letter =
                            letterRating);
                        let newRating = "";

                        switch (newLetterRating) {
                            case "a":
                                newRating = "Adult";
                                break;
                            case "t":
                                newRating = "Teen";
                                break;
                            case "e":
                                newRating = "Everyone";
                                break;
                        }

                        await db.save();

                        return interaction.reply({
                            content: `Media Filter Rating has been set to **${newRating}**`,
                            ephemeral: true,
                        });
                    }
                }
            }
        }
    }
}
