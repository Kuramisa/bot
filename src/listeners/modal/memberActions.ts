import { Listener } from "@sapphire/framework";
import { ModalSubmitInteraction } from "discord.js";

export class MemberActionsModalListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Modal actions from member buttons",
            event: "interactionCreate"
        });
    }

    public async run(interaction: ModalSubmitInteraction<"cached">) {
        if (!interaction.isModalSubmit()) return;

        const id = interaction.customId.split("_")[2];

        if (
            ![`report_member_${id}`, `warn_member_${id}`].includes(
                interaction.customId
            )
        )
            return;

        const { moderation } = this.container;

        const { fields, guild } = interaction;

        const target = await guild.members.fetch(id);

        switch (interaction.customId) {
            case `report_member_${id}`:
                return moderation.reports.create(
                    interaction,
                    target,
                    fields.getTextInputValue("report_reason")
                );
            case `warn_member_${id}`: {
                return moderation.warns.create(
                    interaction,
                    target,
                    fields.getTextInputValue("warn_reason")
                );
            }
        }
    }
}
