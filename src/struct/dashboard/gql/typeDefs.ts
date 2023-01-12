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
    guilds(fetchDb: Boolean, first: Int, offset: Int): [Guild]!

    role(guildId: String!, roleId: String!): Role!
    roles(guildId: String!, first: Int, offset: Int): [Role]!

    channel(guildId: String!, channelId: String!): Channel!
    channels(guildId: String!, first: Int, offset: Int): [Channel]!

    message(
        guildId: String!
        channelId: String!
        messageId: String!
    ): Message!
    messages(guildId: String!, channelId: String!, first: Int, offset: Int): [Message]!

    emoji(guildId: String!, emojiId: String!): Emoji!
    emojis(guildId: String!, first: Int, offset: Int): [Emoji]!

    tickets(guildId: String!, first: Int, offset: Int): [Ticket]!
    ticket(guildId: String!, ticketId: String!): Ticket!
    ticketTranscript(guildId: String!, ticketId: String!): Ticket
    memberTickets(guildId: String!, memberId: String!, first: Int, offset: Int): [Ticket]!

    user(userId: String!, fetchDb: Boolean): User!
    userCard(userId: String!): User!
    users(fetchDb: Boolean, first: Int, offset: Int): [User]!
    userGuilds(auth: String!, fetchDb: Boolean, first: Int, offset: Int): [Guild]!

    member(guildId: String!, memberId: String!, fetchDb: Boolean): Member! @rateLimit(limit: 5, duration: 60)
    members(guildId: String!, fetchDb: Boolean, first: Int, offset: Int): [Member]!

    warns(guildId: String!, userId: String!, first: Int, offset: Int): [Warn]!
    reports(guildId: String!, userId: String!, first: Int, offset: Int): [Report]!
}

type Mutation {
    login(code: String!): String!
    authUser(auth: String!): User!

    warnUser(guildId: String!, userId: String!, reason: String): Warn!
    reportUser(guildId: String!, userId: String!, reason: String): Report!
}
`;
