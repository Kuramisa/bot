import { Command } from "@sapphire/framework";
import { ContextMenuCommandInteraction } from "discord.js";

export class MockCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "mock",
            description: "Mock a user"
        });
    }

    /**
     * Register Context Menu
     */
    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerContextMenuCommand((builder) =>
            builder.setName("Mock").setDMPermission(false).setType(3)
        );
    }

    /**
     * Execute Context Menu
     */
    async contextMenuRun(interaction: ContextMenuCommandInteraction<"cached">) {
        const { guild, channel, targetId, member } = interaction;

        if (!channel) return;
        const message = await channel.messages.fetch(targetId);

        if (message.content.length < 1)
            return interaction.reply({
                content: "Could not find text in the message",
                ephemeral: true
            });

        if (
            channel.isThread() ||
            !guild.members.me?.permissions.has("ManageWebhooks")
        )
            return interaction.reply({
                content: this.mockText(message.content)
            });

        await interaction.deferReply({ ephemeral: true });

        const webhook = await channel.createWebhook({
            name: member.displayName,
            avatar: member.displayAvatarURL({ extension: "gif" })
        });

        await webhook.send({
            content: `${message.member} ${this.mockText(message.content)}`,
            username: member.displayName,
            avatarURL: member.displayAvatarURL({ extension: "gif" })
        });

        await webhook.delete();

        return interaction.editReply({ content: `Mocked ${message.member}` });
    }

    private mockText = (text: string) =>
        text
            .split("")
            .map((word, index) =>
                Number.isInteger(index / 2)
                    ? word.toLowerCase()
                    : word.toUpperCase()
            )
            .join("");
}
