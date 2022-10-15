import { Container } from "@sapphire/pieces";
import Dashboard from "@struct/dashboard";
import { UserInputError } from "apollo-server-core";
import { Request } from "express";

export default {
    Query: {
        guild: async (
            _: any,
            { guildId, fetchDb }: { guildId: string; fetchDb?: boolean },
            {
                req,
                server: { auth },
                container: { client, database, util }
            }: { req: Request; server: Dashboard; container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");

                const iconURL = guild.icon
                    ? util.cdn.icon(guild.id, guild.icon, {
                          extension: guild.icon.startsWith("a_")
                              ? "gif"
                              : "png",
                          size: 1024
                      })
                    : "https://i.imgur.com/SCv8M69.png";

                let info = { iconURL, ...(guild.toJSON() as any) };

                if (fetchDb) {
                    const db = await database.guilds.get(guild);

                    if (db) {
                        info = { ...db._doc, ...info };

                        if (
                            db.promoted &&
                            guild.me?.permissions.has("MANAGE_GUILD")
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
                                            (ch) => ch.type === "GUILD_TEXT"
                                        )
                                        .first() as any
                                );

                            info = { ...info, inviteURL: invite.url };
                        }
                    }
                }

                const user = await auth.check(req);
                if (user) {
                    const member = guild.members.cache.get(user.id);
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
            { fetchDb }: { fetchDb?: boolean },
            { container: { client, database, util } }: { container: Container }
        ) => {
            try {
                const guildsCache = client.guilds.cache;
                const guilds = await Promise.all(
                    guildsCache.map(async (guild) => {
                        const iconURL = guild.icon
                            ? util.cdn.icon(guild.id, guild.icon, {
                                  extension: guild.icon.startsWith("a_")
                                      ? "gif"
                                      : "png",
                                  size: 1024
                              })
                            : "https://i.imgur.com/SCv8M69.png";

                        let info = { iconURL, ...(guild.toJSON() as any) };

                        if (fetchDb) {
                            const db = await database.guilds.get(guild);
                            if (db) {
                                info = { ...db._doc, ...info };

                                if (
                                    db.promoted &&
                                    guild.me?.permissions.has("MANAGE_GUILD")
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
                                                        ch.type === "GUILD_TEXT"
                                                )
                                                .first() as any
                                        );

                                    info = { ...info, inviteURL: invite.url };
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
                fetchDb
            }: { guildId: string; memberId: string; fetchDb?: boolean },
            { container: { client, database, util } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");

                const member = guild.members.cache.get(memberId);
                if (!member) throw new UserInputError("Member not found");
                if (member.user.bot)
                    throw new UserInputError("Member is a bot");

                const avatarURL = member.user.avatar
                    ? util.cdn.avatar(member.id, member.user.avatar)
                    : util.cdn.defaultAvatar(0);

                let info = {
                    ...member,
                    avatarURL
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
            { guildId, fetchDb }: { guildId: string; fetchDb?: boolean },
            { container: { client, database, util } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");

                const members = await Promise.all(
                    (
                        await guild.members.fetch()
                    )
                        .filter((member) => !member.user.bot)
                        .toJSON()
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

                return members;
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
                if (!guild) throw new UserInputError("Guild not found");
                const role =
                    guild.roles.cache.get(roleId) ||
                    guild.roles.cache.find((role) => role.name === roleId);
                if (!role) throw new UserInputError("Role not found");
                return role.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        roles: (
            _: any,
            { guildId }: { guildId: string },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");
                return guild.roles.cache.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        },

        emoji: (
            _: any,
            { guildId, emojiId }: { guildId: string; emojiId: string },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");
                const emoji =
                    guild.emojis.cache.get(emojiId) ||
                    guild.emojis.cache.find((emoji) => emoji.name === emojiId);
                if (!emoji) throw new UserInputError("Emoji not found");
                return emoji.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        emojis: (
            _: any,
            { guildId }: { guildId: string },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");
                return guild.emojis.cache.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        }
    }
};
