import { Container } from "@sapphire/pieces";

export default class Marriage {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

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
