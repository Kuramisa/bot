import { container, Listener } from "@sapphire/framework";

export class MusicConnErrorListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Connection Error for music",
            event: "connectionError",
            emitter: container.systems.music,
        });
    }

    async run(_: any, error: any) {
        container.logger.error(error);
    }
}
