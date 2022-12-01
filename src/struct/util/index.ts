import { Container } from "@sapphire/pieces";
import _ from "lodash";
import axios from "axios";
import {
    ActionRowBuilder,
    AttachmentBuilder,
    BufferResolvable,
    ButtonBuilder,
    ChannelSelectMenuBuilder,
    EmbedBuilder,
    MentionableSelectMenuBuilder,
    MessageActionRowComponentBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    PermissionResolvable,
    PermissionsBitField,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    UserSelectMenuBuilder,
} from "discord.js";
import { Stream } from "stream";
import moment from "moment";

import Nekos from "nekos.life";

import { CDN } from "@discordjs/rest";

import UtilPagination from "./Pagination";
import UtilMember from "./Member";

export default class Util {
    readonly member: UtilMember;
    readonly pagination: UtilPagination;
    readonly nekos: Nekos;
    readonly cdn: CDN;
    readonly _: typeof _;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;

        this.member = new UtilMember(this.container, this);
        this.pagination = new UtilPagination(this.container, this);
        this.nekos = new Nekos();
        this.cdn = new CDN();
        this._ = _;
    }

    permToBit(permissions?: PermissionResolvable) {
        if (!permissions) return undefined;

        return PermissionsBitField.Flags[
            permissions as keyof typeof PermissionsBitField.Flags
        ];
    }

    daysToSecs = (days: number) => days * 24 * 60 * 60;

    row = (): ActionRowBuilder<MessageActionRowComponentBuilder> =>
        new ActionRowBuilder<MessageActionRowComponentBuilder>();
    modalRow = (): ActionRowBuilder<ModalActionRowComponentBuilder> =>
        new ActionRowBuilder<ModalActionRowComponentBuilder>();
    button = () => new ButtonBuilder();

    stringMenu = () => new StringSelectMenuBuilder();
    roleMenu = () => new RoleSelectMenuBuilder();
    mentionableMenu = () => new MentionableSelectMenuBuilder();
    channelMenu = () => new ChannelSelectMenuBuilder();
    userMenu = () => new UserSelectMenuBuilder();

    modal = () => new ModalBuilder();
    unknownModal = () =>
        new ModalBuilder()
            .setCustomId("unknown_modal")
            .setTitle("Something went wrong, please try again");
    input = () => new TextInputBuilder();

    durationMs = (dur: string) =>
        dur
            .split(":")
            .map(Number)
            .reduce((acc, curr) => curr + acc * 60) * 1000;

    msToDur = (ms: number) => moment(ms).format("h:mm:ss");
    formatNumber = (number: any, minFractionDigits = 0) =>
        Number.parseFloat(number).toLocaleString(undefined, {
            minimumFractionDigits: minFractionDigits,
            maximumFractionDigits: 2,
        });
    calcPercentage = (num: any) => num * 100;

    embed = () =>
        new EmbedBuilder()
            .setColor("Orange")
            .setTimestamp(new Date())
            .setFooter({ text: "Owned by Stealth and Bunzi" });
    convertToPercentage = (num: number) => Math.floor(num * 100);
    attachment = (file: BufferResolvable | Stream, name?: string) =>
        new AttachmentBuilder(file, { name });
    embedURL = (title: string, url: string, display?: string) =>
        `[${title}](${url.replace(/\)/g, "%29")}${
            display ? ` "${display}"` : ""
        })`;
    capFirstLetter = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1);

    imageToBuffer = async (url: string) =>
        (
            await axios.get(url, {
                responseType: "arraybuffer",
            })
        ).data;

    chunk(arr: any, size: number) {
        const temp = [];
        for (let i = 0; i < arr.length; i += size) {
            temp.push(arr.slice(i, i + size));
        }

        return temp;
    }

    list(arr: string[], conj = "and") {
        const len = arr.length;
        if (len === 0) return "";
        if (len === 1) return arr[0];
        return `${arr.slice(0, -1).join(", ")}${
            len > 1 ? `${len > 2 ? "," : ""} ${conj} ` : ""
        }${arr.slice(-1)}`;
    }

    capEachFirstLetter(str: string, separator = " ") {
        const temp: string[] = [];
        str.split(separator).forEach((str) => {
            temp.push(this.capFirstLetter(str));
        });

        return temp.join(" ");
    }

    abbrev(num: any) {
        if (!num || isNaN(num)) return 0;
        if (typeof num === "string") num = parseInt(num);
        const decPlaces = Math.pow(10, 1);
        const abbrev = ["K", "M", "B", "T"];
        for (let i = abbrev.length - 1; i >= 0; i--) {
            const size = Math.pow(10, (i + 1) * 3);
            if (size <= num) {
                num = Math.round((num * decPlaces) / size) / decPlaces;
                if (num === 1000 && i < abbrev.length - 1) {
                    num = 1;
                    i++;
                }
                num += abbrev[i];
                break;
            }
        }
        return num;
    }

    shorten = (text: string, maxLen = 200) =>
        text.length > maxLen ? `${text.substring(0, maxLen - 3)}...` : text;
}
