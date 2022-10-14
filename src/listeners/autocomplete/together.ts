import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class TogetherACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Together Activities Autocomplete",
            event: "interactionCreate"
        });
    }

    public async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "together") return;

        const { together, util } = this.container;

        const { options } = interaction;

        const focused = options.getFocused();

        const applications = together.applications;

        let apps = Object.keys(applications)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({
                name: name
                    .split("_")
                    .map((word) => util.capFirstLetter(word))
                    .join(" "),
                value: name
            }));

        if (focused.length > 0)
            apps = apps.filter((app) =>
                app.name.toLowerCase().includes(focused.toLowerCase())
            );

        return interaction.respond(apps);
    }
}
