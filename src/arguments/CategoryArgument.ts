import {
    Args,
    Argument,
    Command,
    CommandOptions,
    PieceContext
} from "@sapphire/framework";
import { Collection } from "discord.js";

export class CategoryArgument extends Argument<
    Collection<string, Command<Args, CommandOptions>>
> {
    constructor(ctx: PieceContext) {
        super(ctx, {
            name: "category"
        });
    }

    run(parameter: string, context: Argument.Context) {
        const category = this.container.client.stores
            .get("commands")
            .filter((command) => command.fullCategory[0] === parameter);

        if (!category || category.size < 1)
            return this.error({
                context,
                parameter,
                message: "The provided could not resolved to a category",
                identifier: "CategoryNotFound"
            });

        return this.ok(category);
    }
}
