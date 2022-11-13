import { Container } from "@sapphire/pieces";
import {
    ButtonInteraction,
    CommandInteraction,
    ContextMenuInteraction,
    GuildMember,
    Message,
    ModalSubmitInteraction
} from "discord.js";

export default class Reports {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    async create(
        interaction:
            | CommandInteraction<"cached">
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
            if (!channel || !channel.isText()) return;
            if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

            const embed = util
                .embed()
                .setAuthor({
                    name: by.user.tag,
                    iconURL: by.displayAvatarURL({ dynamic: true })
                })
                .setTitle(`${by.user.tag} reported ${member.user.tag}`)
                .addFields({ name: "Reason", value: reason });

            channel.send({ embeds: [embed] });
        }

        if (dbGuild.logs.types.memberReported) {
            const channel = guild.channels.cache.get(dbGuild.logs.channel);
            if (!channel || !channel.isText()) return;

            if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

            const embed = util
                .embed()
                .setAuthor({
                    name: `${guild.name} Logs`,
                    iconURL: guild.iconURL({ dynamic: true }) as string
                })
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
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
        interaction: ContextMenuInteraction<"cached">,
        member: GuildMember,
        message: Message,
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
            message: { id: message.id, content: message.content },
            reason
        });

        await dbUser.save();

        if (dbGuild.channels.reports) {
            const channel = guild.channels.cache.get(dbGuild.channels.reports);

            if (!channel || !channel.isText()) return;
            if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

            const embed = util
                .embed()
                .setAuthor({
                    name: by.user.tag,
                    iconURL: by.displayAvatarURL({ dynamic: true })
                })
                .setTitle(`${by.user.tag} reported ${member.user.tag}`)
                .addFields({ name: "Reason", value: reason });

            channel.send({ embeds: [embed] });
        }

        if (dbGuild.logs.types.memberReported) {
            const channel = guild.channels.cache.get(dbGuild.logs.channel);
            if (!channel || !channel.isText()) return;

            if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

            const embed = util
                .embed()
                .setAuthor({
                    name: `${guild.name} Logs`,
                    iconURL: guild.iconURL({ dynamic: true }) as string
                })
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .setDescription(`${by} **Reported** ${member}`)
                .addFields({ name: "Reason", value: reason });

            channel.send({ embeds: [embed] });
        }
    }

    async get(member: GuildMember) {
        const { database } = this.container;

        const db = await database.users.get(member.user);
        if (!db) return;

        return db.reports.filter(
            (report) => report.guildId === member.guild.id
        );
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
                            .setStyle("SHORT")
                            .setMinLength(4)
                            .setMaxLength(100)
                            .setPlaceholder("Type your reason here")
                            .setRequired(true)
                    )
            );
}
