import { Canvas as CanvasM, FontLibrary } from "skia-canvas";
import path from "path";
import getColors from "get-image-colors";

import fetch from "node-fetch";

import { Container } from "@sapphire/pieces";
import MemberCanvas from "./Member";
import GuildWelcome from "./GuildWelcome";
import GuildGoodbye from "./GuildGoodbye";

export default class Canvas {
    readonly member: MemberCanvas;
    readonly welcome: GuildWelcome;
    readonly goodbye: GuildGoodbye;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;

        FontLibrary.use(
            "Coffee",
            path.resolve(
                `${process.cwd()}`,
                "src",
                "assets",
                "fonts",
                "Coffee Extra.ttf"
            )
        );

        this.member = new MemberCanvas(this.container, this);
        this.welcome = new GuildWelcome(this.container, this);
        this.goodbye = new GuildGoodbye(this.container, this);
    }

    makeBackground(color: string) {
        const canvas = new CanvasM(1024, 450);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return canvas.toBuffer("png");
    }

    applyText(
        canvas: CanvasM,
        text: string,
        defaultFontSize: number,
        width: number,
        font: string
    ) {
        const ctx = canvas.getContext("2d");
        do {
            ctx.font = `${(defaultFontSize -= 1)}px ${font}`;
        } while (ctx.measureText(text).width > width);
        return ctx.font;
    }

    async popularColor(url: string) {
        const buffer = await fetch(url).then((res) => res.buffer());

        return (await getColors(buffer, "image/png")).map((color: any) =>
            color.hex()
        );
    }

    validateHex = (hex: string) =>
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);

    invertColor(hex?: string) {
        if (!hex) return "#FFFFFF";
        hex = hex.replace("#", "");

        // match hex color
        if (hex.length === 3)
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (hex.length !== 6) return "#FFFFFF";

        // invert colors
        const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16);
        const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16);
        const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);

        // return new hex
        const pad = (txt: string, length?: number) => {
            length = length || 2;
            const arr = [length].join("0");
            return (arr + txt).slice(-length);
        };

        return `#${pad(r)}${pad(g)}${pad(b)}`;
    }

    abbrev(num: any) {
        if (!num || isNaN(num)) return "0";
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
}
