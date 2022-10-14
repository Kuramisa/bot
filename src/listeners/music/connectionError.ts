import { Listener, container } from "@sapphire/framework";

export class MusicConnErrorListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Connection Error for music",
            event: "connectionError",
            emitter: container.music
        });
    }

    public async run(_: any, error: any) {
        container.logger.error(error);
    }
}
