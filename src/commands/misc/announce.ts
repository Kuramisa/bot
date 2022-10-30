import { Command } from "@sapphire/framework";
import { GuildMember } from "discord.js";

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

        const mInteraction = await interaction.awaitModalSubmit({
            time: 0,
            filter: (i) => i.customId === "announce-modal"
        });

        await mInteraction.deferReply({ ephemeral: true });

        const text = `***Announcement from the Developer***\n\n\`\`\`${mInteraction.fields.getTextInputValue(
            "announcement-text"
        )}\`\`\``;

        const owners: GuildMember[] = [];

        for (const guild of client.guilds.cache.toJSON()) {
            const owner = await guild.fetchOwner();

            if (!owners.some((owner2) => owner2.id == owner.id))
                owners.push(await guild.fetchOwner());
        }

        await mInteraction.editReply({ content: "Announcement sent" });
    }
}
