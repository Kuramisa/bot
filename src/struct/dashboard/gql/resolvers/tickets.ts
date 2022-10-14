/* eslint-disable @typescript-eslint/no-unused-vars */
import { Container } from "@sapphire/pieces";
import { UserInputError } from "apollo-server-core";

export default {
    Query: {
        tickets: async (
            _: any,
            { guildId }: { guildId: string },
            { container: { client, database } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");

                const tickets = (await database.tickets.getAll())
                    .filter((ticket) => ticket.guildId === guild.id)
                    .map((tckt) => {
                        const { transcript, ...ticket } = tckt._doc;

                        return ticket;
                    });

                return tickets;
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
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");

                const tckt = (await database.tickets.getAll()).find(
                    (ticket) =>
                        ticket.guildId === guild.id &&
                        ticket.ticketId === ticketId
                );

                if (!tckt) throw new UserInputError("Ticket not found");

                const { transcript, ...ticket } = tckt._doc;

                return ticket;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
        memberTickets: async (
            _: any,
            { guildId, memberId }: { guildId: string; memberId: string },
            { container: { client, database } }: { container: Container }
        ) => {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");

                const tickets = (await database.tickets.getAll())
                    .filter(
                        (ticket) =>
                            ticket.guildId === guild.id &&
                            ticket.memberId === memberId
                    )
                    .map((tckt) => {
                        const { transcript, ...ticket } = tckt._doc;

                        return ticket;
                    });

                return tickets;
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
                const guild = client.guilds.cache.get(guildId);
                if (!guild) throw new UserInputError("Guild not found");

                const tckt = (await database.tickets.getAll()).find(
                    (ticket) =>
                        ticket.guildId === guild.id &&
                        ticket.ticketId === ticketId
                );

                if (!tckt) throw new UserInputError("Ticket not found");

                return tckt.transcript;
            } catch (err) {
                console.error(err);
                throw err;
            }
        }
    }
};
