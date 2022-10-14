import { Subcommand } from "@sapphire/plugin-subcommands";

export class PlaylistCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "playlist",
            description: "Playlist System",
            subcommands: [
                { name: "play", messageRun: "messagePlay" },
                { name: "create", messageRun: "messageCreate" },
                { name: "import", messageRun: "messageImport" },
                { name: "multimport", messageRun: "messageMultimport" },
                { name: "delete", messageRun: "messageDelete" },
                { name: "add", messageRun: "messageAdd" },
                { name: "mutliadd", messageRun: "messageMultiadd" }
            ]
        });
    }

    public override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .addSubcommand((command) =>
                    command
                        .setName("play")
                        .setDescription("Play one of your playlist")
                        .addStringOption((option) =>
                            option
                                .setName("playlist_name")
                                .setDescription("Name of your playlist")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("create")
                        .setDescription("Create a playlist")
                        .addStringOption((option) =>
                            option
                                .setName("playlist_name")
                                .setDescription("Name for your playlist")
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("import")
                        .setDescription(
                            "Import already existing playlist from other sources"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("playlist_url")
                                .setDescription("Playlist URL")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("multimport")
                        .setDescription(
                            "Import multiple existing playlists from other sources"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("playlist_name")
                                .setDescription("Title for your playlist")
                                .setRequired(true)
                        )
                        .addNumberOption((option) =>
                            option
                                .setName("amount")
                                .setDescription(
                                    "Amount of playlists you want to add"
                                )
                                .setRequired(true)
                                .setMinValue(1)
                                .setMaxValue(5)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("delete")
                        .setDescription("Delete one of your playlists")
                        .addStringOption((option) =>
                            option
                                .setName("playlist_name")
                                .setDescription("Name of your playlist")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("add")
                        .setDescription("Add a single track to your playlist")
                        .addStringOption((option) =>
                            option
                                .setName("playlist_name")
                                .setDescription("Name of your playlist")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("query")
                                .setDescription("Track/Playlist URL or a name")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("multiadd")
                        .setDescription(
                            "Add Multiple Tracks into your playlist"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("playlist_name")
                                .setDescription("Name of your playlist")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("query")
                                .setDescription("Track/Playlist URL or a name")
                                .setRequired(true)
                        )
                )
        );
    }

    public async chatInputRun(
        interaction: Subcommand.ChatInputInteraction<"cached">
    ) {
        const { playlists } = this.container;

        switch (interaction.options.getSubcommand()) {
            case "play":
                await playlists.play(interaction);
                break;
            case "create":
                await playlists.create(interaction);
                break;
            case "import":
                await playlists.import(interaction);
                break;
            case "import_multiple":
                await playlists.importMultiple(interaction);
                break;
            case "add":
                await playlists.add(interaction);
                break;
            case "add_multiple":
                await playlists.addMultiple(interaction);
                break;
            case "delete":
                await playlists.delete(interaction);
                break;
        }
    }
}
