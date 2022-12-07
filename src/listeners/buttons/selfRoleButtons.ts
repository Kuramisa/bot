import { Listener } from "@sapphire/framework";
import { ButtonInteraction } from "discord.js";

export class SelfRoleButtons extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Handle Self Role Buttons",
            event: "interactionCreate",
        });
    }

    async run(interaction: ButtonInteraction) {
        if (!interaction.isButton()) return;

        const { database } = this.container;
        const { channel, guild, message, customId, user } = interaction;
        if (!customId.includes("_sr")) return;
        if (!channel || !guild) return;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const dbChannel = db.selfroles.find((c) => c.channelId === channel.id);
        if (!dbChannel)
            return interaction.reply({
                content: "This channel is not a self role channel",
                ephemeral: true,
            });

        const dbMessage = dbChannel.messages.find((m) => m.id === message.id);
        if (!dbMessage)
            return interaction.reply({
                content: "This message is not a self role message",
                ephemeral: true,
            });

        const dbButton = dbMessage.buttons.find((b) => b.id === customId);
        if (!dbButton)
            return interaction.reply({
                content: "This button is not a self role button",
                ephemeral: true,
            });

        const member = await guild.members.fetch(user.id);

        if (member.roles.cache.has(dbButton.roleId)) {
            await member.roles.remove(dbButton.roleId);
            return interaction.reply({
                content: `Removed role <@&${dbButton.roleId}>`,
                ephemeral: true,
            });
        }

        await member.roles.add(dbButton.roleId);
        return interaction.reply({
            content: `Added role <@&${dbButton.roleId}>`,
            ephemeral: true,
        });
    }
}
