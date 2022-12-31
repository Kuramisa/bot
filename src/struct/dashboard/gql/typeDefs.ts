export default `#graphql
scalar Client
scalar Staff

scalar Guild
scalar Role
scalar Emoji

scalar Channel
scalar Message

scalar User
scalar Member

scalar Object

scalar Ticket

scalar Warn
scalar Report

type Query {
    client: Client!
    clientUser: User!
    clientStaff: Staff!

    guild(guildId: String!, fetchDb: Boolean): Guild!
    guilds(fetchDb: Boolean): [Guild]!

    role(guildId: String!, roleId: String!): Role!
    roles(guildId: String!): [Role]!

    channel(guildId: String!, channelId: String!): Channel!
    channels(guildId: String!): [Channel]!

    message(
        guildId: String!
        channelId: String!
        messageId: String!
    ): Message!
    messages(guildId: String!, channelId: String!): [Message]!

    emoji(guildId: String!, emojiId: String!): Emoji!
    emojis(guildId: String!): [Emoji]!

    tickets(guildId: String!): [Ticket]!
    ticket(guildId: String!, ticketId: String!): Ticket!
    ticketTranscript(guildId: String!, ticketId: String!): Ticket
    memberTickets(guildId: String!, memberId: String!): [Ticket]!

    user(userId: String!, fetchDb: Boolean): User!
    userCard(userId: String!): User!
    users(fetchDb: Boolean): [User]!
    userGuilds(auth: String!, fetchDb: Boolean): [Guild]!

    member(guildId: String!, memberId: String!, fetchDb: Boolean): Member! @rateLimit(limit: 5, duration: 60)
    members(guildId: String!, fetchDb: Boolean): [Member]!

    warns(guildId: String!, userId: String!): [Warn]!
    reports(guildId: String!, userId: String!): [Report]!

    chatLog(username: String!, message: String!, ip: String!): Boolean
}

type Mutation {
    login(code: String!): String!
    authUser(auth: String!): User!

    warnUser(guildId: String!, userId: String!, reason: String): Warn!
    reportUser(guildId: String!, userId: String!, reason: String): Report!
}
`;
