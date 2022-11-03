import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
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

export default class Dashboard extends ApolloServer {
    private readonly container: Container;
    readonly auth: Auth;

    constructor(container: Container) {
        super({
            resolvers,
            typeDefs,
            csrfPrevention: true,
            plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
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
                    "http://kuramisa.com",
                    "http://localhost:3000"
                ],
                credentials: true
            }),
            bodyParser.json(),
            expressMiddleware(this, {
                context: async ({ req }) => ({
                    req,
                    container: this.container,
                    server: this
                })
            })
        );

        await new Promise<void>((resolve) =>
            httpServer.listen({ port: process.env.PORT }, resolve)
        );

        this.container.logger.info(`Server ready at port: ${process.env.PORT}`);
    }
}
