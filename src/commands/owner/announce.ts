import { Command } from "@sapphire/framework";
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    GuildMember,
    TextInputStyle,
} from "discord.js";

const { version } = require("../../../package.json");

export class AnnounceCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "announce",
            description: "Announce bot changes to Server Owners",
            preconditions: ["OwnerOnly"],
        });
    }

    /**
     * Register Slash Command
     */
    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { client, util } = this.container;
        const { user } = interaction;

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
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
            );

        await interaction.showModal(modal);

        const mInteraction = await interaction.awaitModalSubmit({
            time: 0,
            filter: (i) => i.customId === "announce-modal",
        });

        await mInteraction.deferReply({ ephemeral: true });

        const text = `${mInteraction.fields.getTextInputValue(
            "announcement-text"
        )}`;

        const owners: GuildMember[] = [];

        for (const guild of client.guilds.cache.toJSON()) {
            const owner = await guild.fetchOwner();

            if (!owners.some((owner2) => owner2.id === owner.id))
                owners.push(await guild.fetchOwner());
        }

        const embed = util
            .embed()
            .setAuthor({
                name: user.tag,
                iconURL: user.displayAvatarURL({ extension: "gif" }),
            })
            .setTitle("Annoucement from The Developers")
            .setDescription(
                `${text}\n\n*This is from the official developers and will not be used to spam the users*\n**Disclaimer: If you encounter any bugs or unresponsiveness, please DM me directly or use </dev report:1027678917282238594>**\n\n- Sent by ${interaction.member}\n- **${client.user?.username} ${version}**`
            );

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("dismiss-announcement")
                    .setLabel("Dismiss")
                    .setStyle(ButtonStyle.Danger)
            );

        for (const owner of owners) {
            await owner.send({ embeds: [embed], components: [row] });
        }

        await mInteraction.editReply({ content: "Announcement sent" });
    }
}
