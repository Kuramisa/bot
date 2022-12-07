import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class HelpACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Help Autocomplete",
            event: "interactionCreate",
        });
    }

    async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "help") return;

        const { stores } = this.container;

        const { options } = interaction;

        const focused = options.getFocused();

        const commands = stores.get("commands");

        switch (options.getSubcommand()) {
            case "category": {
                let categories: string[] = commands.categories.filter(
                    (cat) => cat !== "owner"
                );

                if (focused.length > 0)
                    categories = categories.filter((cat) =>
                        cat.startsWith(focused)
                    );

                categories = categories.filter((_, i) => i < 25);

                return interaction.respond(
                    categories.map((cat) => ({
                        name: `${cat}`,
                        value: cat,
                    }))
                );
            }
            case "command": {
                let cmds = commands.toJSON();
                if (focused.length > 0)
                    cmds = cmds.filter((command) =>
                        command.name.startsWith(focused)
                    );

                cmds = cmds.filter((_, i) => i < 25);

                return interaction.respond(
                    cmds.map((command) => ({
                        name: `${command.name} - ${command.description}`,
                        value: command.name,
                    }))
                );
            }
        }
    }
}
