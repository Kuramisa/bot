import { Container } from "@sapphire/pieces";
import { GraphQLError } from "graphql";

export default {
    Query: {
        channel: (
            _: any,
            { guildId, channelId }: { guildId: string; channelId: string },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new GraphQLError("Guild not found");
                const channel = guild.channels.cache.get(channelId);
                if (!channel) throw new GraphQLError("Channel not found");
                return channel.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        channels: (
            _: any,
            { guildId }: { guildId: string },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new GraphQLError("Guild not found");
                return guild.channels.cache.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        },

        message: async (
            _: any,
            {
                guildId,
                channelId,
                messageId,
            }: { guildId: string; channelId: string; messageId: string },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new GraphQLError("Guild not found");
                const channel = guild.channels.cache.get(channelId);
                if (!channel) throw new GraphQLError("Channel not found");
                if (!channel.isTextBased())
                    throw new GraphQLError(
                        "Channel provided is not text based"
                    );
                const messages = await channel.messages.fetch();
                const message = messages.get(messageId);
                if (!message) throw new GraphQLError("Message not found");
                return message.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        messages: async (
            _: any,
            { guildId, channelId }: { guildId: string; channelId: string },
            { container: { client } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new GraphQLError("Guild not found");
                const channel = guild.channels.cache.get(channelId);
                if (!channel) throw new GraphQLError("Channel not found");
                if (!channel.isTextBased())
                    throw new GraphQLError(
                        "Channel provided is not text based"
                    );
                const messages = await channel.messages.fetch();
                return messages.toJSON();
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
    },
};
