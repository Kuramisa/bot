import { Container as SapphireContainer } from "@sapphire/pieces";

import { Kurama } from "@struct/Kurama";

import akinator from "discord";
import Canvas from "@struct/canvas";
import Crypt from "@struct/systems/Crypt";
import Database from "@struct/database";
import Games from "@struct/games";
import Moderation from "@struct/moderation";
import Minecraft from "@struct/games/Minecraft";
import Music from "@struct/systems/Music";
import Playlists from "@struct/systems/Playlists";
import Together from "@struct/systems/Together";
import XP from "@struct/systems/XP";
import Util from "@struct/util";
import { Collection } from "discord.js";
import { Command, Args, CommandOptions } from "@sapphire/framework";
import { ValorantAccount } from "@types";
import { Seasons } from "@valapi/valorant-api.com";

declare module "@sapphire/pieces" {
    interface Container {
        mainGuild: Guild;
        botLogs: GuildBasedChannel | null;
        devReports: GuildBasedChannel | null;
        devSuggestions: GuildBasedChannel | null;
        promoteChannel: GuildBasedChannel | null;

        owners: string[];

        canvas: Canvas;
        crypt: Crypt;
        database: Database;
        games: Games;
        moderation: Moderation;
        minecraft: Minecraft;
        music: Music;
        playlists: Playlists;
        together: Together;
        util: Util;
        xp: XP;
    }
}

declare module "@sapphire/framework" {
    interface ArgType {
        category: Collection<string, Command<Args, CommandOptions>>;
        command: Command<Args, CommandOptions>;
        val_user: ValorantAccount;
        val_act: Seasons.Seasons;
    }

    interface Preconditions {
        OwnerOnly: never;
    }
}
