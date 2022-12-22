import { Container } from "@sapphire/pieces";
import { CardType } from "@types";
import { User } from "discord.js";
import { Canvas as CanvasM, loadImage } from "skia-canvas";
import Canvas from ".";

export default class MemberCanvas {
    private readonly container: Container;
    private readonly canvas: Canvas;

    constructor(container: Container, canvas: Canvas) {
        this.container = container;
        this.canvas = canvas;
    }

    async card(user: User, type: CardType = "attachment") {
        const { database, util } = this.container;

        await user.fetch();

        const canvas = new CanvasM(1024, 450);
        const ctx = canvas.getContext("2d");

        const db = await database.users.get(user);

        const data = await util.member.getCardData(db);

        ctx.filter = "blur(6px)";
        switch (data.card.background.type) {
            case "banner": {
                const background = await loadImage(user.bannerURL() as string);
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
                break;
            }
            case "color": {
                ctx.fillStyle = data.card.background.color;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                break;
            }
            case "image": {
                const background = await loadImage(data.card.background.image);
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
                break;
            }
        }
        ctx.filter = "none";

        // Border Layer
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 25, canvas.height);
        ctx.fillRect(canvas.width - 25, 0, 25, canvas.height);
        ctx.fillRect(25, 0, canvas.width - 50, 25);
        ctx.fillRect(25, canvas.height - 25, canvas.width - 50, 25);

        let strokeStyle = "";
        let fillStyle = "";

        switch (data.card.outlines.type) {
            case "banner": {
                const colors = await this.canvas.popularColor(
                    user.bannerURL() as string
                );
                strokeStyle = colors[Math.floor(Math.random() * colors.length)];
                break;
            }
            case "avatar": {
                strokeStyle = user.hexAccentColor
                    ? (user.hexAccentColor as string)
                    : "#808080";
                break;
            }
            case "color": {
                strokeStyle = data.card.outlines.color;
            }
        }

        switch (data.card.text.type) {
            case "banner": {
                const colors = await this.canvas.popularColor(
                    user.bannerURL() as string
                );
                fillStyle = colors[Math.floor(Math.random() * colors.length)];
                break;
            }
            case "avatar": {
                fillStyle = user.hexAccentColor
                    ? (user.hexAccentColor as string)
                    : "#808080";
                break;
            }
            case "color": {
                fillStyle = data.card.text.color;
            }
        }

        // Username
        ctx.globalAlpha = 1;
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.font = this.canvas.applyText(canvas, user.tag, 48, 500, "Coffee");
        ctx.strokeText(user.tag, canvas.width / 2, 255);
        ctx.fillText(user.tag, canvas.width / 2, 255);

        // Progress
        ctx.font = "bold";
        ctx.textAlign = "start";
        ctx.fillText(
            "/ " + this.canvas.abbrev(data.neededXP),
            402 +
                ctx.measureText(this.canvas.abbrev(data.currentXP)).width +
                15,
            310
        );
        ctx.fillText(this.canvas.abbrev(data.currentXP), 400, 310);

        // Avatar
        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.strokeStyle = strokeStyle;
        ctx.arc(canvas.width - 525, 135, 64, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();
        ctx.clip();
        const avatar = await loadImage(
            user.displayAvatarURL({ extension: "png" })
        );
        ctx.drawImage(avatar, canvas.width - 590, 70, 128, 128);

        const buffer = await canvas.toBuffer("png");

        switch (type) {
            case "attachment":
                return util.attachment(buffer, `rank-${user.username}.png`);
            case "buffer":
                return buffer;
        }
    }
}
