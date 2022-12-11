import { HydratedDocument, model, Schema } from "mongoose";

export interface IGuild extends HydratedDocument<any> {
    id: string;
    name: string;
    prefix: string;
    premium: boolean;
    promoted: boolean;
    autorole: string[];
    dvc: {
        parent: string;
        channels: string[];
    }[];
    games: {
        list: string[];
        settings: {
            [x: string]: {
                category: string | null;
                channels: {
                    [x: string]: string[] | string;
                };
                types: string[];
                jtc: {
                    enabled: boolean;
                    channel: string | null;
                };
            };
        };
    };
    channels: {
        rules: string;
        reports: string;
    };
    roles: {
        member: string;
    };
    logs: {
        channel: string;
        types: {
            memberWarned: boolean;
            memberReported: boolean;
            memberJoin: boolean;
            memberLeave: boolean;
            memberBoost: boolean;
            memberUnboost: boolean;
            memberRoleAdded: boolean;
            memberRoleRemoved: boolean;
            memberNicknameChange: boolean;
            messageDeleted: boolean;
            messageEdited: boolean;
        };
    };
    welcomeMessage: {
        enabled: boolean;
        channel: string;
        card: {
            type: "banner" | "color" | "image" | "icon";
            color: string;
            image: Buffer | string;
        };
    };
    goodbyeMessage: {
        enabled: boolean;
        channel: string;
        card: {
            type: "banner" | "color" | "image" | "icon";
            color: string;
            image: Buffer | string;
        };
    };
    toggles: {
        nsfwFilter: boolean;
    };
    tickets: {
        category: string;
        message: string;
        channels: {
            openTicket: string;
            transcripts: string;
        };
        buttons: string[];
    };
    selfroles: {
        channelId: string;
        messages: {
            id: string;
            buttons: {
                id: string;
                name: string;
                roleId: string;
                emoji?: string | null;
                style: number;
            }[];
        }[];
    }[];
}

export const Guild = new Schema<IGuild>({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    prefix: {
        type: String,
        default: "k!",
    },
    premium: {
        type: Boolean,
        default: false,
    },
    autorole: [],
    dvc: [],
    games: {
        list: {
            type: Array,
            default: ["Valorant", "CSGO"],
        },
        settings: {
            type: Object,
            default: {},
        },
    },
    promoted: {
        type: Boolean,
        default: false,
    },
    channels: {
        rules: String,
        reports: String,
    },
    roles: {
        member: String,
    },
    logs: {
        channel: String,
        types: {
            memberWarned: Boolean,
            memberReported: Boolean,
            memberJoin: Boolean,
            memberLeave: Boolean,
            memberBoost: Boolean,
            memberUnboost: Boolean,
            memberRoleAdded: Boolean,
            memberRoleRemoved: Boolean,
            memberNicknameChange: Boolean,
            messageDeleted: Boolean,
            messageEdited: Boolean,
        },
    },
    welcomeMessage: {
        enabled: Boolean,
        channel: String,
        card: {
            type: {
                type: String,
                default: "color",
            },
            color: {
                type: String,
                default: "#D18700",
            },
            image: Schema.Types.Mixed,
        },
    },
    goodbyeMessage: {
        enabled: Boolean,
        channel: String,
        card: {
            type: {
                type: String,
                default: "color",
            },
            color: {
                type: String,
                default: "#D18700",
            },
            image: Schema.Types.Mixed,
        },
    },
    toggles: {
        nsfwFilter: Boolean,
    },
    tickets: {
        category: String,
        message: String,
        channels: {
            openTicket: String,
            transcripts: String,
        },
        buttons: [],
    },
    selfroles: [
        {
            channelId: String,
            messages: [
                {
                    id: String,
                    buttons: [
                        {
                            id: String,
                            name: String,
                            roleId: String,
                            emoji: String,
                            style: Number,
                        },
                    ],
                },
            ],
        },
    ],
});

export default model<IGuild>("guilds", Guild);
