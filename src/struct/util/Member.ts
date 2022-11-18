import { Container } from "@sapphire/pieces";
import { IUser } from "#schemas/User";
import {
    Presence,
    GuildMember,
    ActionRowBuilder,
    EmbedBuilder,
    ActivityType,
    ButtonStyle
} from "discord.js";
import Util from ".";

export default class UtilMember {
    private readonly container: Container;
    private readonly util: Util;

    constructor(container: Container, util: Util) {
        this.container = container;
        this.util = util;
    }

    statusColor(presence: Presence) {
        if (!presence) return "#808080";
        switch (presence.status) {
            case "online": {
                return "#43B581";
            }
            case "dnd": {
                return "#F04747";
            }
            case "idle": {
                return "#FAA61A";
            }
            case "offline":
            case "invisible": {
                return "#747F8E";
            }
        }
    }

    statusEmoji(type: string): string {
        switch (type) {
            case "dnd":
                return ":red_circle:";
            case "idle":
                return ":yellow_circle:";
            case "online":
                return ":green_circle:";
            default:
                return ":white_circle:";
        }
    }

    async getCardData(user: IUser) {
        const {
            systems: { xp }
        } = this.container;

        const neededXP = xp.calculateReqXP(user.level);

        const rank = await this.getRank(user);

        const info = {
            rank,
            card: user.card,
            level: user.level,
            currentXP: user.xp,
            neededXP
        };

        return info;
    }

    async getRank(user: IUser) {
        const users = await this.container.database.users.getAll();
        const sorted = users.sort((a, b) => b.xp - a.xp);

        const mapped = sorted.map((u, i) => ({
            id: u.id,
            xp: u.xp,
            rank: i + 1
        }));

        const rank = mapped.find((u) => u.id === user.id)?.rank;

        return rank;
    }

    async info(
        executor: GuildMember,
        member: GuildMember
    ): Promise<{ embeds: EmbedBuilder[]; components: ActionRowBuilder[] }> {
        const avatar = member.user.displayAvatarURL({
            extension: "gif"
        });
        const activities: string[] = [];
        const status = {
            emoji: ":white_circle:",
            text: "Offline"
        };

        if (member.presence) {
            member.presence.activities.forEach((act) => {
                activities.push(
                    `${
                        act.state ? this.util.list(act.state.split("; ")) : ""
                    } ${act.type === ActivityType.Playing ? act.name : ""} ${
                        act.type === ActivityType.Listening ? "-" : ""
                    } ${act.details ? act.details : ""}`
                );
            });

            status.emoji = this.statusEmoji(member.presence.status);
            status.text =
                member.presence.status !== "dnd"
                    ? `${member.presence.status
                          .charAt(0)
                          .toUpperCase()}${member.presence.status.slice(1)}`
                    : "Do Not Disturb";
        }

        const roles = member.roles.cache.filter(
            (role) => role.name !== "@everyone"
        );
        const mappedRoles = roles.map((role) => `<@&${role.id}>`).join(", ");

        const embed = this.util
            .embed()
            .setAuthor({
                name: member.user.tag,
                iconURL: avatar,
                url: avatar
            })
            .setColor(member.displayHexColor)
            .setURL(avatar)
            .setThumbnail(avatar)
            .setDescription(
                `**Status**: ${status.emoji} ${status.text} ${
                    activities.length > 0
                        ? `\n**Activities**: ${activities.join("")}`
                        : ""
                }`
            )
            .addFields([
                {
                    name: "Joined Server",
                    value: `<t:${Math.floor(
                        (member.joinedTimestamp as number) / 1000
                    )}:R>`,
                    inline: true
                },
                {
                    name: "Joined Discord",
                    value: `<t:${Math.floor(
                        (member.user.createdTimestamp as number) / 1000
                    )}:R>`,
                    inline: true
                },
                {
                    name: `Roles(${roles.size})`,
                    value: mappedRoles
                }
            ])
            .setFooter({ text: `ID: ${member.id}` });

        const rows = this.actionRow(executor);
        return { embeds: [embed], components: rows };
    }

    actionRow(executor: GuildMember): ActionRowBuilder[] {
        const topRow = this.util
            .row()
            .setComponents(
                this.util
                    .button()
                    .setCustomId("show_rank")
                    .setLabel("Show Rank")
                    .setStyle(ButtonStyle.Secondary)
            );

        const midRow = this.util
            .row()
            .setComponents(
                this.util
                    .button()
                    .setCustomId("kick_member")
                    .setLabel("Kick Member")
                    .setStyle(ButtonStyle.Danger),
                this.util
                    .button()
                    .setCustomId("ban_member")
                    .setLabel("Ban Member")
                    .setStyle(ButtonStyle.Danger),
                this.util
                    .button()
                    .setCustomId("report_member")
                    .setLabel("Report Member")
                    .setStyle(ButtonStyle.Danger),
                this.util
                    .button()
                    .setCustomId("warn_member")
                    .setLabel("Warn Member")
                    .setStyle(ButtonStyle.Danger)
            );

        const bottomRow = this.util
            .row()
            .setComponents(
                this.util
                    .button()
                    .setCustomId("show_warns")
                    .setLabel("Show Warns")
                    .setStyle(ButtonStyle.Primary),
                this.util
                    .button()
                    .setCustomId("show_reports")
                    .setLabel("Show Reports")
                    .setStyle(ButtonStyle.Primary)
            );

        return executor.permissions.has("ViewAuditLog")
            ? [topRow, midRow, bottomRow]
            : [
                  topRow.addComponents(
                      this.util
                          .button()
                          .setCustomId("report_member")
                          .setLabel("Report Member")
                          .setStyle(ButtonStyle.Danger)
                  )
              ];
    }
}
