import { Command } from "@sapphire/framework";

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
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerContextMenuCommand((builder) =>
            builder.setName("Mock").setDMPermission(false).setType(3)
        );
    }

    /**
     * Execute Context Menu
     */
    public async contextMenuRun(
        interaction: Command.ContextMenuInteraction<"cached">
    ) {
        const { guild, channel, targetId, member } = interaction;

        if (!channel) return;
        const message = await channel.messages.fetch(targetId);

        if (message.content.length < 1)
            return interaction.reply({
                content: "Could not find text in the message",
                ephemeral: true
            });

        if (channel.isThread() || !guild.me?.permissions.has("MANAGE_WEBHOOKS"))
            return interaction.reply({
                content: this.mockText(message.content)
            });

        await interaction.deferReply({ ephemeral: true });

        const webhook = await channel.createWebhook(member.displayName, {
            avatar: member.displayAvatarURL({ dynamic: true })
        });

        await webhook.send({
            content: `${message.member} ${this.mockText(message.content)}`,
            username: member.displayName,
            avatarURL: member.displayAvatarURL({ dynamic: true })
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
