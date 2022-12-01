import {
    Listener,
    MessageCommandDeniedPayload,
    UserError,
} from "@sapphire/framework";

export class MessageCommandListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Message Command Denied",
            event: "messageCommandDenied",
        });
    }

    async run(error: UserError, { message }: MessageCommandDeniedPayload) {
        if (Reflect.get(Object(error.context), "silent")) return;
        return message.reply(error.message);
    }
}
