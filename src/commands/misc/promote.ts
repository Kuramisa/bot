import { Command } from "@sapphire/framework";
import { ButtonStyle, ChatInputCommandInteraction, Message } from "discord.js";

export class PromoteCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "promote",
            description: "Request a promotion for your server on our website",
            runIn: "GUILD_ANY",
            requiredUserPermissions: "Administrator",
            preconditions: ["OwnerOnly"],
        });
    }

    /**
     * Register Slash Command
     */
    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(1 << 3)
        );
    }

    /**
     * Execute Message Command
     */
    async messageRun(message: Message) {
        const { database, promoteChannel, util } = this.container;

        const { guild, author } = message;

        if (!guild) return;

        const db = await database.guilds.get(guild);

        if (db.promoted) return message.reply(`${guild} is already promoted`);

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("approve_promotion")
                    .setLabel("Approve")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("✅"),
                util
                    .button()
                    .setCustomId("decline_promotion")
                    .setLabel("Decline")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("⛔")
            );

        const embed = util
            .embed()
            .setTitle(`Promotion for ${guild.name}`)
            .setDescription(
                `${author} wants to promote **${guild}** to the website`
            )
            .setFooter({
                text: guild.id,
            });

        await promoteChannel.send({
            embeds: [embed],
            components: [row],
        });

        return message.reply("Promotion request has been sent");
    }

    /**
     * Execute Slash Command
     */
    async chatInputRun(interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild())
            return interaction.reply({
                content: "This command can only be used in a server",
                ephemeral: true,
            });

        const { database, promoteChannel, util } = this.container;

        const { guild, user } = interaction;

        const db = await database.guilds.get(guild);

        if (db.promoted)
            return interaction.reply({
                content: `${guild} is already promoted`,
                ephemeral: true,
            });

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("approve_promotion")
                    .setLabel("Approve")
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("✅"),
                util
                    .button()
                    .setCustomId("decline_promotion")
                    .setLabel("Decline")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("⛔")
            );

        const embed = util
            .embed()
            .setTitle(`Promotion for ${guild.name}`)
            .setDescription(
                `${user} wants to promote **${guild}** to the website`
            )
            .setFooter({
                text: guild.id,
            });

        await promoteChannel.send({
            embeds: [embed],
            components: [row],
        });

        return interaction.reply({
            content: "Promotion request has been sent",
            ephemeral: true,
        });
    }
}
