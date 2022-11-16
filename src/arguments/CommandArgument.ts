import {
    Args,
    Argument,
    Command,
    CommandOptions,
    PieceContext
} from "@sapphire/framework";

export class CommandArguments extends Argument<Command<Args, CommandOptions>> {
    constructor(ctx: PieceContext) {
        super(ctx, {
            name: "command"
        });
    }

    run(parameter: string, context: Argument.Context) {
        const command = this.container.client.stores
            .get("commands")
            .find((command) => command.name === parameter);

        if (!command)
            return this.error({
                context,
                parameter,
                message: "The provided could not resolved to a command",
                identifier: "CommandNotFound"
            });

        return this.ok(command);
    }
}
