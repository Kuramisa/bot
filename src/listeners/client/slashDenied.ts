import {
    ChatInputCommandDeniedPayload,
    Listener,
    UserError
} from "@sapphire/framework";

export class SlashCommandListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Slash Command Denied",
            event: "chatInputCommandDenied"
        });
    }

    public async run(
        error: UserError,
        { interaction }: ChatInputCommandDeniedPayload
    ) {
        if (Reflect.get(Object(error.context), "silent")) return;
        return interaction.reply({ content: error.message, ephemeral: true });
    }
}
