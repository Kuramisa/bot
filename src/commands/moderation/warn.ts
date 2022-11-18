import { Command } from "@sapphire/framework";
import {
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction
} from "discord.js";

export class WarnCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "warn",
            description: "Warn a member",
            requiredUserPermissions: "ModerateMembers"
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(1 << 40)
                .addUserOption((option) =>
                    option
                        .setName("member")
                        .setDescription("Member to warn")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("reason")
                        .setDescription("Reason to warn this member")
                )
        );

        registry.registerContextMenuCommand((builder) =>
            builder.setName("Warn").setType(2)
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction<"cached">) {
        const {
            moderation: { warns }
        } = this.container;

        const { options } = interaction;

        const member = options.getMember("member");
        const reason = options.getString("reason") || "No reason specified";

        if (!member) return;

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true
            });

        return warns.create(interaction, member, reason);
    }

    async contextMenuRun(interaction: ContextMenuCommandInteraction<"cached">) {
        const {
            moderation: { warns }
        } = this.container;

        const { guild, targetId } = interaction;

        const member = await guild.members.fetch(targetId);

        if (member.user.bot)
            return interaction.reply({
                content: `${member} is a bot`,
                ephemeral: true
            });

        return interaction.showModal(warns.modal(member));
    }
}
