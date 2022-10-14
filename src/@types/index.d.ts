import { Client as Assets } from "@valapi/valorant-api.com";
import { Client as Web } from "@valapi/web-client";

export interface TogetherApplications {
    youtube: string;
    youtube_dev: string;
    poker: string;
    betrayal: string;
    fishing: string;
    chess: string;
    chess_dev: string;
    lettertile: string;
    wordsnack: string;
    doodlecrew: string;
    awkword: string;
    spellcast: string;
    checkers: string;
    puttparty: string;
    sketchheads: string;
    ocho: string;
    puttpartyqa: string;
    sketchyartist: string;
    land: string;
    meme: string;
    askaway: string;
    bobble: string;
}

export interface ValorantAccount {
    memberId: string;
    assets: Assets;
    auth: Web;
    puuid: string;
    player: any;
    rank: any;
}

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

export interface ShinobiCurrencies {
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
