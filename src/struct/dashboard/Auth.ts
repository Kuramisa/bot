import Dashboard from ".";
import { Container } from "@sapphire/pieces";

import { Permissions, User } from "discord.js";

import jwt from "jsonwebtoken";
import { ExpressContext } from "apollo-server-express";
import { AuthenticationError } from "apollo-server-express";
import DiscordOAuth2 from "discord-oauth2";

const { JWT_SECRET, SECRET } = process.env;

export default class Auth {
    readonly container: Container;
    private readonly server: Dashboard;

    private readonly jwt: any;
    private readonly oauth: DiscordOAuth2;
    private readonly secrets: { client: string; jwt: string };

    constructor(container: Container, server: Dashboard) {
        this.container = container;
        this.server = server;

        this.jwt = jwt;
        this.oauth = new DiscordOAuth2();
        this.secrets = { client: SECRET as string, jwt: JWT_SECRET as string };
    }

    async getUserGuilds(auth: string, db?: boolean) {
        if (!auth) throw new AuthenticationError("User not logged in");

        const { client, crypt, database, util } = this.container;

        const decoded = this.jwt.verify(crypt.decrypt(auth), this.secrets.jwt);

        const guilds = (
            await this.oauth.getUserGuilds(decoded.token.access_token)
        )
            .filter((guild) =>
                new Permissions(guild.permissions as any).has("MANAGE_GUILD")
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

    check(context: ExpressContext) {
        const header = context.req.headers.authorization;
        if (!header) throw new Error("You must be logged in");
        const token = header.split("Bearer ")[1];
        if (!token)
            throw new Error("Authentication token must be 'Bearer [token]'");
        try {
            const user = jwt.verify(token, this.secrets.jwt);
            return user;
        } catch (err) {
            throw new AuthenticationError(
                "Session timed out, please refresh the page and login again"
            );
        }
    }

    async generateToken(code: any) {
        const { client, crypt } = this.container;

        try {
            const token = await this.oauth.tokenRequest({
                clientId: client.user?.id,
                clientSecret: this.secrets.client,

                code: Buffer.from(code, "base64").toString("ascii"),
                scope: "identify guilds",
                grantType: "authorization_code",
                redirectUri:
                    process.env.NODE_ENV === "production"
                        ? "http://kurama.mateie.com/login"
                        : "http://localhost:3000/login"
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
            throw new AuthenticationError(
                "Authentication failed, please try again"
            );
        }
    }

    async authUser(auth: string) {
        if (!auth)
            throw new AuthenticationError("Authentication data not provided");

        const { client, crypt, database, util } = this.container;

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
            throw new AuthenticationError(
                "Authentication failed, please try again"
            );
        }
    }
}