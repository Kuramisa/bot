/* eslint-disable @typescript-eslint/no-unused-vars */
import { Container } from "@sapphire/pieces";
import { GraphQLError } from "graphql";

export default {
    Query: {
        tickets: async (
            _: any,
            {
                guildId,
                first,
                offset,
            }: { guildId: string; first?: number; offset?: number },
            { container: { client, database } }: { container: Container }
        ) => {
            try {
                const guild = await client.guilds.fetch(guildId);
                if (!guild) throw new GraphQLError("Guild not found");

                return (await database.tickets.getAll())
                    .filter((ticket) => ticket.guildId === guild.id)
                    .slice(offset, first)
                    .map((tckt) => {
                        const { transcript, ...ticket } = tckt._doc;

                        return ticket;
                    });
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        ticket: async (
            _: any,
            { guildId, ticketId }: { guildId: string; ticketId: string },
            { container: { client, database } }: { container: Container }
        ) => {
            try {
                const guild = await client.guilds.fetch(guildId);
                if (!guild) throw new GraphQLError("Guild not found");

                const tckt = (await database.tickets.getAll()).find(
                    (ticket) =>
                        ticket.guildId === guild.id &&
                        ticket.ticketId === ticketId
                );

                if (!tckt) throw new GraphQLError("Ticket not found");

                const { transcript, ...ticket } = tckt._doc;

                return ticket;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        memberTickets: async (
            _: any,
            {
                guildId,
                memberId,
                first,
                offset,
            }: {
                guildId: string;
                memberId: string;
                first?: number;
                offset?: number;
            },
            { container: { client, database } }: { container: Container }
        ) => {
            try {
                const guild = await client.guilds.fetch(guildId);
                if (!guild) throw new GraphQLError("Guild not found");

                return (await database.tickets.getAll())
                    .filter(
                        (ticket) =>
                            ticket.guildId === guild.id &&
                            ticket.memberId === memberId
                    )
                    .slice(offset, first)
                    .map((tckt) => {
                        const { transcript, ...ticket } = tckt._doc;

                        return ticket;
                    });
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        ticketTranscript: async (
            _: any,
            { guildId, ticketId }: { guildId: string; ticketId: string },
            { container: { client, database } }: { container: Container }
        ) => {
            try {
                const guild = await client.guilds.fetch(guildId);
                if (!guild) throw new GraphQLError("Guild not found");

                const tckt = (await database.tickets.getAll()).find(
                    (ticket) =>
                        ticket.guildId === guild.id &&
                        ticket.ticketId === ticketId
                );

                if (!tckt) throw new GraphQLError("Ticket not found");

                return tckt.transcript;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
    },
};
