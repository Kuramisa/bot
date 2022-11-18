import { Container } from "@sapphire/pieces";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    GuildMember,
    Message,
    ModalSubmitInteraction,
    TextInputStyle
} from "discord.js";

export default class Reports {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async create(
        interaction:
            | ChatInputCommandInteraction<"cached">
            | ButtonInteraction<"cached">
            | ModalSubmitInteraction<"cached">,
        member: GuildMember,
        reason: string
    ) {
        const { database, util } = this.container;

        const { guild, member: by } = interaction;

        const dbUser = await database.users.get(member.user);
        const dbGuild = await database.guilds.get(guild);

        if (!dbUser || !dbGuild) return;

        dbUser.reports.push({
            guildId: guild.id,
            by: by.id,
            reason
        });

        await dbUser.save();

        if (dbGuild.channels.reports) {
            const channel = guild.channels.cache.get(dbGuild.channels.reports);
            if (!channel || !channel.isTextBased()) return;
            if (!guild.members.me?.permissionsIn(channel).has("SendMessages"))
                return;

            const embed = util
                .embed()
                .setAuthor({
                    name: by.user.tag,
                    iconURL: by.displayAvatarURL({ extension: "gif" })
                })
                .setTitle(`${by.user.tag} reported ${member.user.tag}`)
                .addFields({ name: "Reason", value: reason });

            channel.send({ embeds: [embed] });
        }

        if (dbGuild.logs.types.memberReported) {
            const channel = guild.channels.cache.get(dbGuild.logs.channel);
            if (!channel || !channel.isTextBased()) return;

            if (!guild.members.me?.permissionsIn(channel).has("SendMessages"))
                return;

            const embed = util
                .embed()
                .setAuthor({
                    name: `${guild.name} Logs`,
                    iconURL: guild.iconURL({ extension: "gif" }) as string
                })
                .setThumbnail(member.displayAvatarURL({ extension: "gif" }))
                .setDescription(`${by} **Reported** ${member}`)
                .addFields({ name: "Reason", value: reason });

            channel.send({ embeds: [embed] });
        }

        return interaction.reply({
            content: `You reported ${member} for **${reason}**`,
            ephemeral: true
        });
    }

    async createMessageReport(
        interaction: ModalSubmitInteraction<"cached">,
        member: GuildMember,
        message: Message<true>,
        reason: string
    ) {
        const { database, util } = this.container;

        const { guild, member: by } = interaction;

        await interaction.deferReply({ ephemeral: true });

        const dbUser = await database.users.get(member.user);
        const dbGuild = await database.guilds.get(guild);

        if (!dbUser || !dbGuild)
            return interaction.editReply({
                content: "Something went wrong, please try again"
            });

        dbUser.reports.push({
            guildId: guild.id,
            by: by.id,
            message: { id: message.id, content: message.content },
            reason
        });

        await dbUser.save();

        if (dbGuild.channels.reports) {
            const channel = guild.channels.cache.get(dbGuild.logs.channel);
            if (!channel || !channel.isTextBased()) return;

            if (!guild.members.me?.permissionsIn(channel).has("SendMessages"))
                return;

            const embed = util
                .embed()
                .setAuthor({
                    name: `${guild.name} Logs`,
                    iconURL: guild.iconURL({ extension: "gif" }) as string
                })
                .setThumbnail(member.displayAvatarURL({ extension: "gif" }))
                .setDescription(
                    `${by} **Reported** ${member}'s Message\n\n[Message Link](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`
                )
                .addFields({ name: "Reason", value: reason });

            channel.send({ embeds: [embed] });
        }

        if (dbGuild.logs.types.memberReported) {
            const channel = guild.channels.cache.get(dbGuild.logs.channel);
            if (!channel || !channel.isTextBased()) return;

            if (!guild.members.me?.permissionsIn(channel).has("SendMessages"))
                return;

            const embed = util
                .embed()
                .setAuthor({
                    name: `${guild.name} Logs`,
                    iconURL: guild.iconURL({ extension: "gif" }) as string
                })
                .setThumbnail(member.displayAvatarURL({ extension: "gif" }))
                .setDescription(
                    `${by} **Reported** ${member}'s Message\n\n[Message Link](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`
                )
                .addFields({ name: "Reason", value: reason });

            channel.send({ embeds: [embed] });
        }

        return interaction.editReply({
            content: `You reported ${member}'s [Message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}) for **${reason}**`
        });
    }

    async get(member: GuildMember) {
        const { database } = this.container;

        const db = await database.users.get(member.user);
        if (!db) return;

        return db.reports.filter(
            (report) => report.guildId === member.guild.id
        );
    }

    async clear(interaction: ChatInputCommandInteraction, member: GuildMember) {
        const { database } = this.container;

        const db = await database.users.get(member.user);
        if (!db) return;

        db.reports = db.reports.filter(
            (report) => report.guildId !== member.guild.id
        );

        await db.save();

        return interaction.reply({
            content: `Cleared reports for ${member}`,
            ephemeral: true
        });
    }

    total = async (member: GuildMember) => (await this.get(member))?.length;

    modal = (member: GuildMember) =>
        this.container.util
            .modal()
            .setCustomId(`report_member_${member.id}`)
            .setTitle(`Reporting ${member.user.tag}`)
            .setComponents(
                this.container.util
                    .modalRow()
                    .setComponents(
                        this.container.util
                            .input()
                            .setCustomId("report_reason")
                            .setLabel("Report Reason")
                            .setStyle(TextInputStyle.Short)
                            .setMinLength(4)
                            .setMaxLength(100)
                            .setPlaceholder("Type your reason here")
                            .setRequired(true)
                    )
            );

    messageModal = (member: GuildMember) =>
        this.container.util
            .modal()
            .setCustomId(`report_member_${member.id}_message`)
            .setTitle(`Reporting ${member.user.tag}`)
            .setComponents(
                this.container.util
                    .modalRow()
                    .setComponents(
                        this.container.util
                            .input()
                            .setCustomId("report_reason")
                            .setLabel("Report Reason")
                            .setStyle(TextInputStyle.Short)
                            .setMinLength(4)
                            .setMaxLength(100)
                            .setPlaceholder("Type your reason here")
                            .setRequired(true)
                    )
            );
}
