import { Listener, container } from "@sapphire/framework";

export class MusicErrorListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Logs error from the music player",
            event: "error",
            emitter: container.systems.music
        });
    }

    public async run(_: any, error: any) {
        container.logger.error(error);
    }
}
