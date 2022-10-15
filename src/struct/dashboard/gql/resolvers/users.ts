import { Container } from "@sapphire/pieces";
import Dashboard from "@struct/dashboard";
import { UserInputError } from "apollo-server-core";
import { Request } from "express";

export default {
    Query: {
        user: async (
            _: any,
            { userId, fetchDb }: { userId: string; fetchDb?: boolean },
            { container: { client, database, util } }: { container: Container }
        ) => {
            try {
                const user = client.users.cache.get(userId);
                if (!user) throw new UserInputError("User not found");
                if (user.bot) throw new UserInputError("User is a bot");

                const avatarURL = user.avatar
                    ? util.cdn.avatar(user.id, user.avatar)
                    : util.cdn.defaultAvatar(0);

                let info = { ...user, avatarURL };

                if (fetchDb) {
                    const db = await database.users.get(user);
                    if (db) info = { ...db._doc, ...info };
                }

                return info;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        userCard: async (
            _: any,
            { userId }: { userId: string },
            { container: { client, canvas } }: { container: Container }
        ) => {
            try {
                const user = client.users.cache.get(userId);
                if (!user) throw new UserInputError("User not found");
                if (user.bot) throw new UserInputError("User is a bot");

                const image = await canvas.member.card(user, "buffer");

                return image;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        users: async (
            _: any,
            { fetchDb }: { fetchDb?: boolean },
            { container: { client, database, util } }: { container: Container }
        ) => {
            const usersCache = client.users.cache;
            try {
                const users = await Promise.all(
                    usersCache
                        .filter((user) => !user.bot)
                        .toJSON()
                        .map(async (user) => {
                            const avatarURL = user.avatar
                                ? util.cdn.avatar(user.id, user.avatar)
                                : util.cdn.defaultAvatar(0);

                            let info = { ...user, avatarURL };

                            if (fetchDb) {
                                const db = await database.users.get(user);

                                if (db) info = { ...db._doc, ...info };
                            }

                            return info;
                        })
                );

                return users;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },

        userGuilds: async (
            _: any,
            { auth: authData, fetchDb }: { auth: string; fetchDb?: boolean },
            { server: { auth } }: { server: Dashboard }
        ) => {
            return auth.getUserGuilds(authData, fetchDb);
        },

        warns: async (
            _: any,
            { guildId, userId }: { guildId: string; userId: string },
            { container: { client, moderation } }: { container: Container }
        ) => {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) throw new Error("Guild not found");

            const member = guild.members.cache.get(userId);
            if (!member) throw new Error("Member not found");

            return await moderation.warns.get(member);
        },
        reports: async (
            _: any,
            { guildId, userId }: { guildId: string; userId: string },
            { container: { client, moderation } }: { container: Container }
        ) => {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) throw new Error("Guild not found");

            const member = guild.members.cache.get(userId);
            if (!member) throw new Error("Member not found");

            return await moderation.reports.get(member);
        }
    },
    Mutation: {
        warnUser: async (
            _: any,
            {
                guildId,
                userId,
                reason
            }: { guildId: string; userId: string; reason?: string },
            {
                req,
                server: { auth },
                container: { client, database, util }
            }: { req: Request; server: Dashboard; container: Container }
        ) => {
            try {
                const user = await auth.check(req);

                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new Error("Guild not found");

                const warnedBy = guild.members.cache.get(user.id);
                if (!warnedBy) throw new Error("Member not found");

                if (!warnedBy.permissions.has("MODERATE_MEMBERS"))
                    throw new Error("Not enough permissions");

                const member = guild.members.cache.get(userId);
                if (!member) throw new Error("Member not found");

                const dbUser = await database.users.get(member.user);
                const dbGuild = await database.guilds.get(guild);

                if (!dbUser || !dbGuild)
                    throw new Error("Database data is missing");

                if (!reason || reason.length < 1)
                    reason = "No reason specified";

                const warn = {
                    guildId: guild.id,
                    by: warnedBy.id,
                    reason
                };

                dbUser.warns.push(warn);

                await dbUser.save();

                if (dbGuild.logs.types.memberWarned) {
                    const channel = guild.channels.cache.get(
                        dbGuild.logs.channel
                    );
                    if (!channel || !channel.isText()) return;
                    if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES"))
                        return;

                    const embed = util
                        .embed()
                        .setAuthor({
                            name: `${guild.name} Logs`,
                            iconURL: guild.iconURL({ dynamic: true }) as string
                        })
                        .setThumbnail(
                            member.displayAvatarURL({ dynamic: true })
                        )
                        .setDescription(`${warnedBy} **Warned** ${member}`)
                        .addFields({ name: "Reason", value: reason });

                    channel.send({ embeds: [embed] });
                }

                return warn;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        reportUser: async (
            _: any,
            {
                guildId,
                userId,
                reason
            }: { guildId: string; userId: string; reason?: string },
            {
                req,
                server: { auth },
                container: { client, database, util }
            }: { req: Request; server: Dashboard; container: Container }
        ) => {
            try {
                const user = await auth.check(req);

                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new Error("Guild not found");

                const warnedBy = guild.members.cache.get(user.id);
                if (!warnedBy) throw new Error("Member not found");

                const member = guild.members.cache.get(userId);
                if (!member) throw new Error("Member not found");

                const dbUser = await database.users.get(member.user);
                const dbGuild = await database.guilds.get(guild);

                if (!dbUser || !dbGuild)
                    throw new Error("Database data is missing");

                if (!reason || reason.length < 1)
                    reason = "No reason specified";

                const report = {
                    guildId: guild.id,
                    by: warnedBy.id,
                    reason
                };

                dbUser.reports.push(report);

                await dbUser.save();

                if (dbGuild.logs.types.memberReported) {
                    const channel = guild.channels.cache.get(
                        dbGuild.logs.channel
                    );
                    if (!channel || !channel.isText()) return;
                    if (!guild.me?.permissionsIn(channel).has("SEND_MESSAGES"))
                        return;

                    const embed = util
                        .embed()
                        .setAuthor({
                            name: `${guild.name} Logs`,
                            iconURL: guild.iconURL({ dynamic: true }) as string
                        })
                        .setThumbnail(
                            member.displayAvatarURL({ dynamic: true })
                        )
                        .setDescription(`${warnedBy} **Reported** ${member}`)
                        .addFields({ name: "Reason", value: reason });

                    channel.send({ embeds: [embed] });
                }

                return report;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },

        login: async (
            _: any,
            { code }: { code: any },
            { server: { auth } }: { server: Dashboard }
        ) => {
            return auth.generateToken(code);
        },
        authUser: async (
            _: any,
            { auth: authData }: { auth: any },
            { server: { auth } }: { server: Dashboard }
        ) => {
            return auth.authUser(authData);
        }
    }
};
