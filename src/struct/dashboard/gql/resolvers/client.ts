import Staff from "#schemas/Staff";
import { Container } from "@sapphire/pieces";

export default {
    Query: {
        client: async (
            _: any,
            __: any,
            { container: { client } }: { container: Container }
        ) => client,
        clientUser: async (
            _: any,
            __: any,
            { container: { client } }: { container: Container }
        ) => {
            try {
                const user = await client.user?.fetch();
                const app = await client.application?.fetch();

                return {
                    ...user,
                    description: app?.description,
                    avatarURL: user?.displayAvatarURL(),
                    guilds: client.guilds.cache.size,
                    users: client.users.cache.size
                };
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        clientStaff: async (
            _: any,
            __: any,
            { container: { client, util } }: { container: Container }
        ) =>
            await Promise.all(
                (
                    await Staff.find()
                ).map(async (user) => {
                    const u = await client.users.fetch(user.id, {
                        force: true
                    });
                    return {
                        ...user._doc,
                        ...u,
                        formattedType: util.capFirstLetter(user.type),
                        avatarURL: u.avatar?.includes("a_")
                            ? u.avatarURL({ extension: "gif", size: 128 })
                            : u.avatarURL({ extension: "png", size: 128 })
                    };
                })
            )
    }
};
