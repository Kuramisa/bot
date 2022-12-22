import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction, TextChannel } from "discord.js";

export class SelfRolesAC extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Autocomplete for Self Roles",
            event: "interactionCreate",
        });
    }

    async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;

        const { database, util } = this.container;

        const { options, guild, commandName } = interaction;
        if (commandName !== "selfroles") return;
        if (!guild) return;

        const db = await database.guilds.get(guild);

        const focused = options.getFocused(true);

        switch (focused.name) {
            case "sr_channel_name": {
                const channels = db.selfroles.map((sr) =>
                    guild.channels.cache.get(sr.channelId)
                ) as TextChannel[];

                if (focused.value.length > 1)
                    channels.filter((ch) =>
                        ch.name
                            .toLowerCase()
                            .startsWith(focused.value.toLowerCase())
                    );

                return interaction.respond(
                    channels.map((ch) => ({
                        name: util.shorten(`${ch.name} - ID: ${ch.id}`, 99),
                        value: ch.id,
                    }))
                );
            }
            case "sr_message": {
                const channelId = options.getString("sr_channel_name", true);
                const channel = guild.channels.cache.find(
                    (ch) => ch.id === channelId
                );
                if (!channel || !channel.isTextBased()) return;

                const dbChannel = db.selfroles.find(
                    (sr) => sr.channelId === channel.id
                );
                if (!dbChannel) return;

                const messages = await channel.messages.fetch();

                return interaction.respond(
                    messages.map((msg) => ({
                        name: util.shorten(
                            `${msg.content} - ID: ${msg.id}`,
                            99
                        ),
                        value: msg.id,
                    }))
                );
            }
        }
    }
}
