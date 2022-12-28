import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";

export class ClearCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "clear",
            description: "Clear channel messages",
            requiredUserPermissions: "ManageMessages",
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(
                    PermissionsBitField.Flags.ManageMessages
                )
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

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const { util } = this.container;
        const { options, guild, channel } = interaction;

        if (!guild.members.me?.permissions.has("ManageMessages"))
            return interaction.reply({
                content: "Bot missing permissions `ManageMessages`",
                ephemeral: true,
            });

        if (!channel || !channel.isTextBased()) return;

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
