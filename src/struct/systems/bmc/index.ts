import { Container } from "@sapphire/pieces";
import BMAC from "buymeacoffee.js";
import Premium from "./Premium";

const { BMAC_API } = process.env;

export default class BMC {
    readonly container: Container;

    readonly api: typeof BMAC;

    readonly premium: Premium;

    constructor(container: Container) {
        this.container = container;

        this.api = new BMAC(BMAC_API);

        this.premium = new Premium(this.container, this.api);
    }
}
