import { Argument, PieceContext, Resolvers } from "@sapphire/framework";
import { ValorantAccount } from "@types";

export class ValorantUserArgument extends Argument<ValorantAccount> {
    constructor(ctx: PieceContext) {
        super(ctx, {
            name: "val_user"
        });
    }

    public async run(parameter: string, context: Argument.Context) {
        const resolve = await Resolvers.resolveUser(parameter);

        if (resolve.isErr())
            return this.error({
                parameter,
                identifier: "invalid_user",
                message: "Invalid User Provided",
                context
            });

        const account = this.container.games.valorant.accounts.get(
            resolve.unwrap().id
        );

        if (!account)
            return this.error({
                parameter,
                identifier: "invalid_account",
                message: "Valorant Account not found",
                context
            });

        return this.ok(account);
    }
}
