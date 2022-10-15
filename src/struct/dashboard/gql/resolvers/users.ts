import { Container } from "@sapphire/pieces";
import Dashboard from "@struct/dashboard";
import { UserInputError } from "apollo-server-core";

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
        }
    },
    Mutation: {
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
