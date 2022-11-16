import { Command } from "@sapphire/framework";

export class ClearCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "clear",
            description: "Clear channel messages",
            requiredUserPermissions: "MANAGE_MESSAGES"
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(1 << 13)
                .addNumberOption((option) =>
                    option
                        .setName("amount")
                        .setDescription("Amount of messages")
                        .setRequired(true)
                )
                .addUserOption((option) =>
                    option
                        .setName("target")
                        .setDescription("Member to clear their messages")
                )
        );
    }

    async chatInputRun(interaction: Command.ChatInputInteraction<"cached">) {
        const { util } = this.container;

        const { options, guild, channel } = interaction;

        if (!guild.me?.permissions.has("MANAGE_MESSAGES"))
            return interaction.reply({
                content: "Bot missing permissiosns `ManageMessages`",
                ephemeral: true
            });

        if (!channel || !channel.isText()) return;

        const amount = options.getNumber("amount", true);
        const member = options.getMember("target");

        const embed = util.embed();

        if (member) {
            const messages = (await channel.messages.fetch()).filter(
                (m) => m.author.id === member.id
            );

            await channel.bulkDelete(messages, true).then((messages) => {
                embed.setDescription(
                    `Cleared **${messages.size}** from ${member} in this channel`
                );
            });

            return interaction.reply({ embeds: [embed] });
        }

        await channel.bulkDelete(amount, true).then((messages) => {
            embed.setDescription(
                `Cleared **${messages.size}** from this channel`
            );
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
