import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { rateLimitDirective } from "graphql-rate-limit-directive";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { Container } from "@sapphire/pieces";

import express from "express";
import helmet from "helmet";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";

import Auth from "./Auth";

import resolvers from "./gql/resolvers";
import typeDefs from "./gql/typeDefs";

const app = express();
app.use(helmet());

const httpServer = http.createServer(app);

const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } =
    rateLimitDirective();

let schema = makeExecutableSchema({
    typeDefs: [rateLimitDirectiveTypeDefs, typeDefs],
    resolvers,
});

schema = rateLimitDirectiveTransformer(schema);

export default class Dashboard extends ApolloServer {
    readonly auth: Auth;
    private readonly container: Container;

    constructor(container: Container) {
        super({
            schema,
            csrfPrevention: true,
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        });

        this.container = container;

        this.auth = new Auth(this.container);
    }

    async init() {
        await this.start();

        app.use(
            "/",
            cors<cors.CorsRequest>({
                origin: [
                    "https://kuramisa.com",
                    "http://localhost:3000",
                    "https://dev.kuramisa.com",
                ],
            }),
            bodyParser.json(),
            expressMiddleware(this, {
                context: async ({ req }) => ({
                    req,
                    container: this.container,
                    server: this,
                }),
            })
        );

        httpServer.listen({ port: process.env.PORT });

        this.container.logger.info(`Server ready at port: ${process.env.PORT}`);
    }
}
