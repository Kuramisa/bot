import { Subcommand } from "@sapphire/plugin-subcommands";

export class GoodbyeCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "goodbye",
            description: "Manage Goodbye message for the server",
            requiredUserPermissions: "MANAGE_GUILD"
        });
    }

    public override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(1 << 5)
                .addSubcommand((command) =>
                    command
                        .setName("banner")
                        .setDescription("Server banner as the background")
                )
                .addSubcommand((command) =>
                    command
                        .setName("icon")
                        .setDescription("Server icon as the background")
                )
                .addSubcommand((command) =>
                    command
                        .setName("color")
                        .setDescription("Use a color for the background")
                        .addStringOption((option) =>
                            option
                                .setName("color")
                                .setDescription("Color to set it to")
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("image")
                        .setDescription("Use custom image for the background")
                        .addAttachmentOption((option) =>
                            option
                                .setName("image")
                                .setDescription("Background Image")
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("image_url")
                        .setDescription(
                            "Use custom image URL for the background"
                        )
                        .addStringOption((option) =>
                            option
                                .setName("url")
                                .setDescription("URL for the background image")
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("channel")
                        .setDescription("Set a channel for welcome message")
                        .addChannelOption((option) =>
                            option
                                .setName("text_channel")
                                .setDescription("Text channel for the message")
                                .addChannelTypes(0)
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("toggle")
                        .setDescription("Toggle the goodbye message")
                )
        );
    }

    public async chatInputRun(
        interaction: Subcommand.ChatInputInteraction<"cached">
    ) {
        const {
            canvas: { goodbye }
        } = this.container;

        switch (interaction.options.getSubcommand()) {
            case "banner":
                await goodbye.banner(interaction);
                break;
            case "icon":
                await goodbye.icon(interaction);
                break;
            case "color":
                await goodbye.color(interaction);
                break;
            case "image":
                await goodbye.image(interaction);
                break;
            case "image_url":
                await goodbye.imageURL(interaction);
                break;
            case "channel":
                await goodbye.channel(interaction);
                break;
            case "toggle":
                await goodbye.toggle(interaction);
                break;
        }
    }
}
