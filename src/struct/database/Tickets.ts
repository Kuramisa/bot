import Ticket from "#schemas/Ticket";
import { Guild, GuildMember, TextBasedChannel } from "discord.js";

export default class DatabaseTickets {
    create = async ({
        id,
        guild,
        member,
        channel,
        type,
    }: {
        id: string | number;
        guild: Guild;
        member: GuildMember;
        channel: TextBasedChannel;
        type: string;
    }) =>
        Ticket.create({
            ticketId: id,
            guildId: guild.id,
            memberId: member.id,
            channelId: channel.id,
            closed: false,
            locked: false,
            type,
        });

    async unlock(id: string) {
        const ticket = await Ticket.findOne({ channelId: id });
        if (!ticket) return null;

        ticket.locked = false;

        await ticket.save();

        return ticket;
    }

    async lock(id: string) {
        const ticket = await Ticket.findOne({ channelId: id });
        if (!ticket) return null;

        ticket.locked = true;

        await ticket.save();

        return ticket;
    }

    async open(id: string) {
        const ticket = await Ticket.findOne({ channelId: id });
        if (!ticket) return null;

        ticket.closed = false;

        await ticket.save();

        return ticket;
    }

    async close(id: string) {
        const ticket = await Ticket.findOne({ channelId: id });
        if (!ticket) return null;

        ticket.closed = true;

        await ticket.save();

        return ticket;
    }

    async isClosed(id: string) {
        const ticket = await Ticket.findOne({ channelId: id });
        if (!ticket) return null;

        return ticket.closed;
    }

    async isLocked(id: string) {
        const ticket = await Ticket.findOne({ channelId: id });
        if (!ticket) return null;

        return ticket.locked;
    }

    get = async (id: string) => await Ticket.findOne({ channelId: id });
    getAll = async () => await Ticket.find();
}
