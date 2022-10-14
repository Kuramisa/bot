import { Listener } from "@sapphire/framework";
import { ModalSubmitInteraction } from "discord.js";

export class RulesModalListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Modal actions from rules command",
            event: "interactionCreate"
        });
    }

    public async run(interaction: ModalSubmitInteraction<"cached">) {
        if (!interaction.isModalSubmit()) return;

        if (!["rules_create", "rules_edit"].includes(interaction.customId))
            return;

        const { database, util } = this.container;

        const { fields, guild } = interaction;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const channel =
            guild.channels.cache.get(db.channels.rules) || guild.rulesChannel;

        if (!channel)
            return interaction.reply({
                content: "No rules channel found",
                ephemeral: true
            });

        if (!channel.isText()) return;

        switch (interaction.customId) {
            case "rules_create": {
                const rulesStr = fields.getTextInputValue("rules_input_create");

                const row = util
                    .row()
                    .setComponents(
                        util
                            .button()
                            .setCustomId("accept_rules")
                            .setLabel("Accept Rules")
                            .setEmoji("📝")
                            .setStyle("SECONDARY")
                    );

                await channel.send({ content: rulesStr, components: [row] });

                return interaction.reply({
                    content: `Rules were created, check ${channel}`,
                    ephemeral: true
                });
            }
            case "rules_edit": {
                const rulesStr = fields.getTextInputValue("rules_input_edit");

                const message = (await channel.messages.fetch()).first();

                if (!message) return;

                await message.edit({ content: rulesStr });

                return interaction.reply({
                    content: `Edited current rules, check ${channel}`,
                    ephemeral: true
                });
            }
        }
    }
}
