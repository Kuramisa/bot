import { Container } from "@sapphire/pieces";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    ModalSubmitInteraction,
    TextInputStyle
} from "discord.js";

export default class Warns {
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

        dbUser.warns.push({
            guildId: guild.id,
            by: by.id,
            reason
        });

        await dbUser.save();

        if (dbGuild.logs.types.memberWarned) {
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
                .setDescription(`${by} **Warned** ${member}`)
                .addFields({ name: "Reason", value: reason });

            channel.send({ embeds: [embed] });
        }

        return interaction.reply({
            content: `${member} was warned by ${by} - ***Reason***: ${reason}`
        });
    }

    async get(member: GuildMember) {
        const { database } = this.container;

        const db = await database.users.get(member.user);
        if (!db) return;

        return db.warns.filter((warn) => warn.guildId === member.guild.id);
    }

    total = async (member: GuildMember) => (await this.get(member))?.length;

    modal = (member: GuildMember) =>
        this.container.util
            .modal()
            .setCustomId(`warn_member_${member.id}`)
            .setTitle(`Warning ${member.user.tag}`)
            .setComponents(
                this.container.util
                    .modalRow()
                    .setComponents(
                        this.container.util
                            .input()
                            .setCustomId("warn_reason")
                            .setLabel("Warn Reason")
                            .setStyle(TextInputStyle.Short)
                            .setMinLength(4)
                            .setMaxLength(100)
                            .setPlaceholder("Type your reason here")
                            .setRequired(true)
                    )
            );
}
