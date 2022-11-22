import { Container } from "@sapphire/pieces";
import { User } from "discord.js";

export default class Marriage {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    engage(user: User, to: User) {}

    marry() {
        throw new Error("Method not implemented");
    }

    divorce() {
        throw new Error("Method not implemented");
    }

    status() {
        throw new Error("Method not implemented");
    }
}
