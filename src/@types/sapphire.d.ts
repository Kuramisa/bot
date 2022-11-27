import { Container as SapphireContainer } from "@sapphire/pieces";

import akinator from "discord";
import Canvas from "#struct/canvas";
import Database from "#struct/database";
import Games from "#struct/games";
import Moderation from "#struct/moderation";
import Util from "#struct/util";
import { Collection } from "discord.js";
import { Command, Args, CommandOptions } from "@sapphire/framework";
import { Seasons } from "@valapi/valorant-api.com";
import Dashboard from "#struct/dashboard";
import Systems from "#struct/systems";

import { TStaff } from "#schemas/Staff";

declare module "@sapphire/pieces" {
    interface Container {
        mainGuild: Guild;
        botLogs: GuildBasedChannel | null;
        devReports: GuildBasedChannel | null;
        devSuggestions: GuildBasedChannel | null;
        promoteChannel: GuildBasedChannel | null;

        owners: string[];

        staff: TStaff[];

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
        PremiumOnly: never;
        BetaTesterOnly: never;
    }
}
