import { Container } from "@sapphire/pieces";

import { PermissionsBitField, User } from "discord.js";

import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import DiscordOAuth2 from "discord-oauth2";
import { Request } from "express";

const { JWT_SECRET, SECRET } = process.env;

export default class Auth {
    readonly container: Container;

    private readonly jwt: any;
    private readonly oauth: DiscordOAuth2;
    private readonly secrets: { client: string; jwt: string };

    constructor(container: Container) {
        this.container = container;

        this.jwt = jwt;
        this.oauth = new DiscordOAuth2();
        this.secrets = { client: SECRET as string, jwt: JWT_SECRET as string };
    }

    async getUser(auth: any) {
        if (!auth) throw new GraphQLError("User not logged in");

        return await this.oauth.getUser(auth.token.access_token);
    }

    async getUserGuilds(auth: string, db?: boolean) {
        if (!auth) throw new GraphQLError("User not logged in");

        const {
            client,
            systems: { crypt },
            database,
            util
        } = this.container;

        const decoded = this.jwt.verify(crypt.decrypt(auth), this.secrets.jwt);

        const guilds = (
            await this.oauth.getUserGuilds(decoded.token.access_token)
        )
            .filter((guild) =>
                new PermissionsBitField(guild.permissions as any).has(
                    "ManageGuild"
                )
            )
            .map(async (guild) => {
                const iconURL = guild.icon
                    ? util.cdn.icon(guild.id, guild.icon, {
                          extension: guild.icon.startsWith("a_")
                              ? "gif"
                              : "png",
                          size: 1024
                      })
                    : "https://i.imgur.com/SCv8M69.png";

                const botJoined = client.guilds.cache.has(guild.id);

                let info = { iconURL, botJoined, ...guild };

                if (botJoined) {
                    const clientGuild = client.guilds.cache.get(guild.id);
                    if (clientGuild) {
                        const json = clientGuild.toJSON() as any;
                        info = { ...info, ...json };

                        if (db) {
                            const db = await database.guilds.get(clientGuild);

                            if (db) info = { ...info, ...db._doc };
                        }
                    }
                }

                return info;
            });

        return Promise.all(guilds);
    }

    async checkToken(req: Request) {
        const {
            systems: { crypt },
            dashboard
        } = this.container;

        const header = req.headers.authorization;
        if (!header) throw new Error("You must be logged in");
        const token = header.split("Bearer ")[1];
        if (!token)
            throw new Error("Authentication token must be 'Bearer [token]'");
        try {
            const jwtData = jwt.verify(crypt.decrypt(token), this.secrets.jwt);
            const user = await dashboard.auth.getUser(jwtData);
            return user;
        } catch (err) {
            console.error(err);
            throw new GraphQLError(
                "Session timed out, please refresh the page and login again"
            );
        }
    }

    async check(req: Request) {
        const {
            systems: { crypt },
            dashboard
        } = this.container;

        const header = req.headers.authorization;
        if (!header) return null;
        const token = header.split("Bearer ")[1];
        if (!token) return null;
        try {
            const jwtData = jwt.verify(crypt.decrypt(token), this.secrets.jwt);
            const user = await dashboard.auth.getUser(jwtData);
            return user;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async generateToken(code: any) {
        const {
            client,
            systems: { crypt }
        } = this.container;

        try {
            const token = await this.oauth.tokenRequest({
                clientId: client.user?.id,
                clientSecret: this.secrets.client,

                code: Buffer.from(code, "base64").toString("ascii"),
                scope: "identify guilds",
                grantType: "authorization_code",
                redirectUri:
                    process.env.NODE_ENV === "development"
                        ? "http://localhost:3000/login"
                        : "https://kuramisa.com/login"
            });

            return crypt.encrypt(
                this.jwt.sign(
                    {
                        token
                    },
                    this.secrets.jwt
                )
            );
        } catch (err) {
            console.error(err);
            throw new GraphQLError("Authentication failed, please try again");
        }
    }

    async authUser(auth: string) {
        if (!auth) throw new GraphQLError("Authentication data not provided");

        const {
            client,
            systems: { crypt },
            database,
            util
        } = this.container;

        try {
            const decoded = this.jwt.verify(
                crypt.decrypt(auth),
                this.secrets.jwt
            );
            const user = await this.oauth.getUser(decoded.token.access_token);

            const avatarURL = user.avatar
                ? util.cdn.avatar(user.id, user.avatar)
                : util.cdn.defaultAvatar(0);

            const bannerURL = user.banner
                ? util.cdn.banner(user.id, user.banner, {
                      size: 2048
                  })
                : null;

            let info = { ...user, avatarURL, bannerURL };

            if (client.users.cache.has(user.id)) {
                const db = await database.users.get(
                    client.users.cache.get(user.id) as User
                );

                if (db) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { card, ...dbInfo } = db._doc;

                    info = { ...info, ...dbInfo };
                }
            }

            return info;
        } catch (err) {
            console.error(err);
            throw new GraphQLError("Authentication failed, please try again");
        }
    }
}
