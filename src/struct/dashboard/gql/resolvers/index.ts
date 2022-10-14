import client from "./client";
import guilds from "./guilds";
import channels from "./channels";
import users from "./users";
import tickets from "./tickets";
import minecraft from "./minecraft";

export default {
    Query: {
        ...client.Query,
        ...guilds.Query,
        ...channels.Query,
        ...tickets.Query,
        ...users.Query
    },
    Mutation: {
        ...users.Mutation,
        ...minecraft.Mutation
    }
};
