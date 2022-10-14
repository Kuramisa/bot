import { Container } from "@sapphire/pieces";
import {
    ButtonInteraction,
    CommandInteraction,
    GuildMember,
    ModalSubmitInteraction
} from "discord.js";

export default class Warns {
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
        const { guild, member: by } = interaction;

        const dbUser = await this.container.database.users.get(member.user);
        const dbGuild = await this.container.database.guilds.get(guild);

        if (!dbUser || !dbGuild) return;

        dbUser.warns.push({
            guildId: guild.id,
            by: by.id,
            reason
        });

        await dbUser.save();

        if (dbGuild.logs.types.memberWarned) {
            const channel = guild.channels.cache.get(dbGuild.logs.channel);
            if (!channel || !channel.isText()) return;
            if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES")) return;

            const embed = this.container.util
                .embed()
                .setAuthor({
                    name: `${guild.name} Logs`,
                    iconURL: guild.iconURL({ dynamic: true }) as string
                })
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .setDescription(`${by} **Warned** ${member}`)
                .addFields({ name: "Reason", value: reason });

            channel.send({ embeds: [embed] });
        }

        return interaction.reply({
            content: `${member} was warned by ${by} - ***Reason***: ${reason}`
        });
    }

    async get(member: GuildMember) {
        const db = await this.container.database.users.get(member.user);
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
                            .setStyle("SHORT")
                            .setMinLength(4)
                            .setMaxLength(100)
                            .setPlaceholder("Type your reason here")
                            .setRequired(true)
                    )
            );
}
