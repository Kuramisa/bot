import { Container } from "@sapphire/pieces";
import Dashboard from "#struct/dashboard";
import { GraphQLError } from "graphql";
import { Request } from "express";
import { ChannelType } from "discord.js";

export default {
    Query: {
        guild: async (
            _: any,
            { guildId, fetchDb }: { guildId: string; fetchDb?: boolean },
            {
                req,
                server: { auth },
                container: { client, database, util },
            }: { req: Request; server: Dashboard; container: Container }
        ) => {
            try {
                const guild = await client.guilds.fetch(guildId);
                if (!guild) throw new GraphQLError("Guild not found");

                const iconURL = guild.icon
                    ? util.cdn.icon(guild.id, guild.icon, {
                          extension: guild.icon.startsWith("a_")
                              ? "gif"
                              : "png",
                          size: 1024,
                      })
                    : "https://i.imgur.com/SCv8M69.png";

                let info = { iconURL, ...(guild.toJSON() as any) };

                if (fetchDb) {
                    const db = await database.guilds.get(guild);

                    if (db) {
                        info = { ...db._doc, ...info };

                        if (
                            db.promoted &&
                            guild.members.me?.permissions.has("ManageGuild")
                        ) {
                            let invite = (await guild.invites.fetch())
                                .sort(
                                    (a, b) =>
                                        (b.uses as number) - (a.uses as number)
                                )
                                .first();

                            if (!invite)
                                invite = await guild.invites.create(
                                    guild.channels.cache
                                        .filter(
                                            (ch) =>
                                                ch.type ===
                                                ChannelType.GuildText
                                        )
                                        .first() as any
                                );

                            info = { ...info, inviteURL: invite.url };
                        }
                    }
                }

                const user = await auth.check(req);
                if (user) {
                    const member = await guild.members
                        .fetch(user.id)
                        .catch(console.error);
                    if (member) {
                        const authPerms = member.permissions.toArray();
                        info = { authPerms, ...info };
                    }
                }

                return info;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        guilds: async (
            _: any,
            {
                fetchDb,
                first,
                offset,
            }: { fetchDb?: boolean; first?: number; offset?: number },
            { container: { client, database, util } }: { container: Container }
        ) => {
            try {
                const guildsCache = client.guilds.cache
                    .toJSON()
                    .slice(offset, first);

                const guilds = await Promise.all(
                    guildsCache.map(async (guild) => {
                        const iconURL = guild.icon
                            ? util.cdn.icon(guild.id, guild.icon, {
                                  extension: guild.icon.startsWith("a_")
                                      ? "gif"
                                      : "png",
                                  size: 1024,
                              })
                            : "https://i.imgur.com/SCv8M69.png";

                        let info = { iconURL, ...(guild.toJSON() as any) };

                        if (fetchDb) {
                            const db = await database.guilds.get(guild);
                            if (db) {
                                info = { ...db._doc, ...info };

                                if (
                                    db.promoted &&
                                    guild.members.me?.permissions.has(
                                        "ManageGuild"
                                    )
                                ) {
                                    let invite = (await guild.invites.fetch())
                                        .sort(
                                            (a, b) =>
                                                (b.uses as number) -
                                                (a.uses as number)
                                        )
                                        .first();

                                    if (!invite)
                                        invite = await guild.invites.create(
                                            guild.channels.cache
                                                .filter(
                                                    (ch) =>
                                                        ch.type ===
                                                        ChannelType.GuildText
                                                )
                                                .first() as any
                                        );

                                    info = {
                                        ...info,
                                        inviteURL: invite.url,
                                    };
                                }
                            }
                        }

                        return info;
                    })
                );
                return guilds
                    .sort((a, b) => b.memberCount - a.memberCount)
                    .sort((a, b) => Number(b.promoted) - Number(a.promoted));
            } catch (err) {
                console.error(err);
                throw err;
            }
        },

        member: async (
            _: any,
            {
                guildId,
                memberId,
                fetchDb,
            }: { guildId: string; memberId: string; fetchDb?: boolean },
            { container: { client, database, util } }: { container: Container }
        ) => {
            try {
                const guild = await client.guilds.fetch(guildId);
                if (!guild) throw new GraphQLError("Guild not found");

                const member = await guild.members.fetch(memberId);
                if (!member) throw new GraphQLError("Member not found");
                if (member.user.bot) throw new GraphQLError("Member is a bot");

                const avatarURL = member.user.avatar
                    ? util.cdn.avatar(member.id, member.user.avatar)
                    : util.cdn.defaultAvatar(0);

                let info = {
                    ...member,
                    avatarURL,
                };

                if (fetchDb) {
                    const db = await database.users.get(member.user);
                    if (db) info = { ...db._doc, ...info };
                }

                return info;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        members: async (
            _: any,
            {
                guildId,
                fetchDb,
                first,
                offset,
            }: {
                guildId: string;
                fetchDb?: boolean;
                first?: number;
                offset?: number;
            },
            { container: { client, database, util } }: { container: Container }
        ) => {
            try {
                const guild = await client.guilds.fetch(guildId);
                if (!guild) throw new GraphQLError("Guild not found");

                return await Promise.all(
                    (
                        await guild.members.cache
                    )
                        .filter((member) => !member.user.bot)
                        .toJSON()
                        .slice(offset, first)
                        .map(async (member) => {
                            const avatarURL = member.user.avatar
                                ? util.cdn.avatar(member.id, member.user.avatar)
                                : util.cdn.defaultAvatar(0);

                            let info = { ...member, avatarURL };

                            if (fetchDb) {
                                const db = await database.users.get(
                                    member.user
                                );

                                if (db) info = { ...db._doc, ...info };
                            }

                            return info;
                        })
                );
            } catch (err) {
                console.error(err);
                throw err;
            }
        },

        role: (
            _: any,
            { guildId, roleId }: { guildId: string; roleId: string },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new GraphQLError("Guild not found");
                const role =
                    guild.roles.cache.get(roleId) ||
                    guild.roles.cache.find((role) => role.name === roleId);
                if (!role) throw new GraphQLError("Role not found");
                return role.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        roles: (
            _: any,
            {
                guildId,
                first,
                offset,
            }: { guildId: string; first?: number; offset?: number },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new GraphQLError("Guild not found");
                return guild.roles.cache.toJSON().slice(first, offset);
            } catch (err) {
                console.error(err);
                throw err;
            }
        },

        emoji: (
            _: any,
            {
                guildId,
                emojiId,
            }: {
                guildId: string;
                emojiId: string;
            },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new GraphQLError("Guild not found");
                const emoji =
                    guild.emojis.cache.get(emojiId) ||
                    guild.emojis.cache.find((emoji) => emoji.name === emojiId);
                if (!emoji) throw new GraphQLError("Emoji not found");
                return emoji.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        emojis: (
            _: any,
            {
                guildId,
                first,
                offset,
            }: { guildId: string; first?: number; offset?: number },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new GraphQLError("Guild not found");
                return guild.emojis.cache.toJSON().slice(first, offset);
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
    },
};
