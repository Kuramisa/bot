import mongoose from "mongoose";
import { Container } from "@sapphire/pieces";

import DatabaseGuilds from "./Guilds";
import DatabasePlaylists from "./Playlists";
import DatabaseTickets from "./Tickets";
import DatabaseUsers from "./Users";

const { DB } = process.env;

export default class Database {
    private readonly container: Container;

    readonly connection: typeof mongoose;

    readonly guilds: DatabaseGuilds;
    readonly playlists: DatabasePlaylists;
    readonly tickets: DatabaseTickets;
    readonly users: DatabaseUsers;

    public constructor(container: Container) {
        this.container = container;
        this.connection = mongoose;

        this.guilds = new DatabaseGuilds(this.container);
        this.playlists = new DatabasePlaylists();
        this.tickets = new DatabaseTickets();
        this.users = new DatabaseUsers(this.container);
    }

    connect = () =>
        this.connection
            .connect(DB as string)
            .then(() => this.container.logger.info("Connected to the database"))
            .catch(this.container.logger.error);
    disconnect = () =>
        this.connection
            .disconnect()
            .then(() =>
                this.container.logger.info("Disconnected from the database")
            )
            .catch(this.container.logger.error);
}
