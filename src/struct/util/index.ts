import { Container } from "@sapphire/pieces";
import axios from "axios";
import {
    BufferResolvable,
    MessageEmbed,
    MessageActionRow,
    MessageActionRowComponent,
    ModalActionRowComponent,
    MessageAttachment,
    MessageButton,
    MessageSelectMenu,
    Modal,
    TextInputComponent,
    PermissionResolvable,
    Permissions,
    MessageActionRowComponentResolvable
} from "discord.js";
import { Stream } from "stream";
import moment from "moment";

import Nekos from "nekos.life";

import { CDN } from "@discordjs/rest";

import UtilPagination from "./Pagination";
import UtilMember from "./Member";

export default class Util {
    private readonly container: Container;
    readonly member: UtilMember;
    readonly pagination: UtilPagination;
    readonly nekos: Nekos;
    readonly cdn: CDN;

    constructor(container: Container) {
        this.container = container;

        this.member = new UtilMember(this.container, this);
        this.pagination = new UtilPagination(this.container, this);
        this.nekos = new Nekos();
        this.cdn = new CDN();
    }

    permToBit(permissions?: PermissionResolvable) {
        if (!permissions) return undefined;

        return Permissions.FLAGS[permissions as keyof typeof Permissions.FLAGS];
    }

    daysToSecs = (days: number) => days * 24 * 60 * 60;

    row = (): MessageActionRow<MessageActionRowComponent> =>
        new MessageActionRow<MessageActionRowComponent>();
    modalRow = (): MessageActionRow<ModalActionRowComponent> =>
        new MessageActionRow<ModalActionRowComponent>();
    button = () => new MessageButton();
    dropdown = () => new MessageSelectMenu();
    modal = () => new Modal();
    input = () => new TextInputComponent();

    durationMs = (dur: string) =>
        dur
            .split(":")
            .map(Number)
            .reduce((acc, curr) => curr + acc * 60) * 1000;

    msToDur = (ms: number) => moment(ms).format("h:mm:ss");
    formatNumber = (number: any, minFractionDigits = 0) =>
        Number.parseFloat(number).toLocaleString(undefined, {
            minimumFractionDigits: minFractionDigits,
            maximumFractionDigits: 2
        });
    calcPercentage = (num: any) => num * 100;

    embed = () =>
        new MessageEmbed()
            .setColor("ORANGE")
            .setTimestamp(new Date())
            .setFooter({ text: "Owned by Stealth and Bunzi" });
    convertToPercentage = (num: number) => Math.floor(num * 100);
    attachment = (file: BufferResolvable | Stream, name?: string) =>
        new MessageAttachment(file, name);
    embedURL = (title: string, url: string, display?: string) =>
        `[${title}](${url.replace(/\)/g, "%29")}${
            display ? ` "${display}"` : ""
        })`;
    capFirstLetter = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1);

    imageToBuffer = async (url: string) =>
        (
            await axios.get(url, {
                responseType: "arraybuffer"
            })
        ).data;

    commandType(number: number) {
        switch (number) {
            case 2:
                return "User Context Command";
            case 3:
                return "Message Context Command";
            default:
                return "Slash Command";
        }
    }

    optionType(number: number) {
        switch (number) {
            case 1:
                return "Sub Command";
            case 2:
                return "Sub Command Group";
            case 3:
                return "String";
            case 4:
                return "Integer";
            case 5:
                return "Boolean";
            case 6:
                return "User";
            case 7:
                return "Channel";
            case 8:
                return "Role";
            case 9:
                return "Mentionable";
            case 10:
                return "Number";
            case 11:
                return "Attachment";
            default:
                return "Unknown";
        }
    }

    chunk(arr: any, size: number) {
        const temp = [];
        for (let i = 0; i < arr.length; i += size) {
            temp.push(arr.slice(i, i + size));
        }

        return temp;
    }

    list(arr: string[], conj = "and") {
        const len = arr.length;
        if (len == 0) return "";
        if (len == 1) return arr[0];
        return `${arr.slice(0, -1).join(", ")}${
            len > 1 ? `${len > 2 ? "," : ""} ${conj} ` : ""
        }${arr.slice(-1)}`;
    }

    capEachFirstLetter(str: string, seperator = " ") {
        const temp: string[] = [];
        str.split(seperator).forEach((str) => {
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
                if (num == 1000 && i < abbrev.length - 1) {
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
