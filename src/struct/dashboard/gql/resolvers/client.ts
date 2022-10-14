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
        }
    }
};
