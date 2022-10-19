import { ApolloServer } from "apollo-server-express";
import {
    ApolloServerPluginDrainHttpServer,
    ApolloServerPluginLandingPageLocalDefault
} from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";

import { Container } from "@sapphire/pieces";

import express from "express";
import http from "http";
import Auth from "./Auth";

import resolvers from "./gql/resolvers";
import typeDefs from "./gql/typeDefs";

const app = express();
const httpServer = http.createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });
const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/subscriptions"
});

const pubsub = new PubSub();

const serverCleanup = useServer({ schema }, wsServer);

export default class Dashboard extends ApolloServer {
    private readonly container: Container;
    readonly auth: Auth;

    constructor(container: Container) {
        super({
            schema,
            csrfPrevention: true,
            cache: "bounded",
            plugins: [
                ApolloServerPluginDrainHttpServer({ httpServer }),
                {
                    async serverWillStart() {
                        return {
                            async drainServer() {
                                await serverCleanup.dispose();
                            }
                        };
                    }
                },
                ApolloServerPluginLandingPageLocalDefault({ embed: true })
            ],
            context: ({ req }) => ({
                container,
                server: this,
                req,
                pubsub
            })
        });

        this.container = container;

        this.auth = new Auth(this.container, this);
    }

    async init() {
        await this.start();
        this.applyMiddleware({ app, path: "/" });

        await new Promise<void>((resolve) =>
            httpServer.listen({ port: process.env.PORT || 4000 }, resolve)
        );

        this.container.logger.info(`Server ready at port: ${this.graphqlPath}`);
    }
}
