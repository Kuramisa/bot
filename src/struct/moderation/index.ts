import { Container } from "@sapphire/pieces";

import Reports from "./Reports";
import SelfRoles from "#struct/moderation/SelfRoles";
import Tickets from "./Tickets";
import Warns from "./Warns";

import imageModeration from "image-moderation";

const { MODERATE_API } = process.env;

export default class Moderation {
    readonly reports: Reports;
    readonly selfroles: SelfRoles;
    readonly tickets: Tickets;
    readonly warns: Warns;
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;

        this.reports = new Reports(this.container);
        this.selfroles = new SelfRoles(this.container);
        this.tickets = new Tickets(this.container);
        this.warns = new Warns(this.container);
    }

    async image(url: string) {
        const res = await imageModeration.evaluate(url, MODERATE_API);
        return JSON.parse(res);
    }
}
