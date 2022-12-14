import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class TicketButtonsACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Context) {
        super(ctx, {
            ...opts,
            name: "Ticket Buttons Autocomplete",
            event: "interactionCreate",
        });
    }

    async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "tickets") return;
        if (!interaction.inCachedGuild()) return;

        const { database, util } = this.container;

        const { options, guild } = interaction;

        if (
            options.getSubcommandGroup() !== "buttons" &&
            options.getSubcommand() !== "remove"
        )
            return;

        const db = await database.guilds.get(guild);

        return interaction.respond(
            db.tickets.buttons.map((choice) => ({
                name: choice.includes("-")
                    ? util.capEachFirstLetter(choice.split("_ticket")[0], "-")
                    : util.capFirstLetter(choice.split("_ticket")[0]),
                value: choice,
            }))
        );
    }
}
