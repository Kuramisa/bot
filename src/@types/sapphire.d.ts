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
import Playlists from "@struct/systems/Playlist";
import Together from "@struct/systems/Together";
import XP from "@struct/systems/XP";
import Util from "@struct/util";
import { Collection } from "discord.js";
import { Command, Args, CommandOptions } from "@sapphire/framework";
import { ValorantAccount } from "@types";
import { Seasons } from "@valapi/valorant-api.com";
import Dashboard from "@struct/dashboard";
import Systems from "@struct/systems";

declare module "@sapphire/pieces" {
    interface Container {
        mainGuild: Guild;
        botLogs: GuildBasedChannel | null;
        devReports: GuildBasedChannel | null;
        devSuggestions: GuildBasedChannel | null;
        promoteChannel: GuildBasedChannel | null;

        owners: string[];

        dashboard: Dashboard;

        canvas: Canvas;
        database: Database;
        games: Games;
        moderation: Moderation;
        systems: Systems;
        util: Util;
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
