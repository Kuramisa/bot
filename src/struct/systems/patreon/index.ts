import { Container } from "@sapphire/pieces";
import { Patreon as PatreonAPI } from "@anitrack/patreon-wrapper";
import Premium from "./Premium";

const { PATREON_API } = process.env;

export default class Patreon {
    readonly container: Container;

    readonly api: typeof PatreonAPI;

    readonly premium: Premium;

    constructor(container: Container) {
        this.container = container;

        this.api = PatreonAPI;

        this.api.Authorization({
            AccessToken: PATREON_API as string,
            CampaignID: "9431016"
        });

        this.premium = new Premium(this.container, this.api);
    }
}
