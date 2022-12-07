import {
    ContextMenuCommandDeniedPayload,
    Listener,
    UserError,
} from "@sapphire/framework";

export class SlashCommandListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Context Command Denied",
            event: "contextMenuCommandDenied",
        });
    }

    async run(
        error: UserError,
        { interaction }: ContextMenuCommandDeniedPayload
    ) {
        if (Reflect.get(Object(error.context), "silent")) return;
        return interaction.reply({ content: error.message, ephemeral: true });
    }
}
