import { Command } from "@sapphire/framework";

const { version } = require("../../../package.json");

export class AnnounceCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "announce",
            description: "Announce bot changes to Server Owners",
            preconditions: ["OwnerOnly"]
        });
    }

    /**
     * Register Slash Command
     */
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputInteraction) {
        const { client, util } = this.container;

        const modal = util
            .modal()
            .setCustomId("announce-modal")
            .setTitle("Announcing Bot Changes to users")
            .setComponents(
                util
                    .modalRow()
                    .setComponents(
                        util
                            .input()
                            .setCustomId("announcement-text")
                            .setLabel("Announcement")
                            .setStyle("PARAGRAPH")
                            .setRequired(true)
                    )
            );

        await interaction.showModal(modal);

        const submitted = await interaction.awaitModalSubmit({ time: 0 });

        await submitted.deferReply({ ephemeral: true });

        const text = `***Announcement from the Developer***\n\n\`\`\`${submitted.fields.getTextInputValue(
            "announcement-text"
        )}\`\`\``;

        client.guilds.cache.forEach(async (guild) => {
            const owner = await guild.fetchOwner();

            owner
                .send({
                    content: `${text}\n\n*This is from the official developers and will not be used to spam the users*\n\n- **${client.user?.username} ${version}**`
                })
                .catch(console.error);
        });

        await submitted.editReply({ content: "Announcement sent" });
    }
}
