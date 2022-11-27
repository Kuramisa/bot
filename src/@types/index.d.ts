import { Client as Assets } from "@valapi/valorant-api.com";
import { Client as Web } from "@valapi/web-client";

export interface ValorantAccount {
    memberId: string;
    assets: Assets;
    auth: Web;
    puuid: string;
    player: any;
    rank: any;
}

export type IWarn = {
    id: string;
    guildId: string;
    by: string;
    reason: string;
};

export type IReport = {
    id: string;
    guildId: string;
    by: string;
    message?: { id: string; content: string };
    reason: string;
};

export type StaffType = "owner" | "helper";

export type CardType = "buffer" | "attachment";

// Shinobi Types
export interface ShinobiClan {
    id: string;
    name: string;
    description: string;
    members: number;
    icon: string;
    stats: ShinobiStats;
}

export interface ShinobiVillage {
    id: string;
    name: {
        en: string;
        jp: string;
    };
    description: string;
    population: number;
    icon: string;
}

export interface ShinobiStats {
    hp: number;
    chakra: number;
    ninjutsu: number;
    genjutsu: number;
    taijutsu: number;
    kenjutsu: number;
}

export interface Currencies {
    ryo: number;
}

export interface ShinobiWeapon {
    id: string;
    name: string;
    icon: string;
    attack: number;
    cost: number;
}

export type ShinobiRanks =
    | "genin"
    | "chunin"
    | "jonin"
    | "special_jonin"
    | "hokage"
    | "anbu"
    | "medical"
    | "rogue";
