import { Piece, Precondition } from "@sapphire/framework";
import {
    CommandInteraction,
    ContextMenuInteraction,
    Message,
    User
} from "discord.js";

export class BetaTesterOnlyPrecondition extends Precondition {
    constructor(ctx: Piece.Context, opts: Precondition.Options) {
        super(ctx, {
            ...opts,
            name: "BetaTesterOnly"
        });
    }

    public override messageRun = async (message: Message) =>
        await this.checkBetaTester(message.author);

    public override chatInputRun = async (interaction: CommandInteraction) =>
        await this.checkBetaTester(interaction.user);

    public override contextMenuRun = async (
        interaction: ContextMenuInteraction
    ) => await this.checkBetaTester(interaction.user);

    private async checkBetaTester(user: User) {
        const { database, owners } = this.container;
        if (owners.includes(user.id)) return this.ok();

        const db = await database.users.get(user);
        if (!db)
            return this.error({
                message: "User not found"
            });

        if (!db.betaTester)
            return this.error({
                message: "User not a Beta Tester"
            });

        return this.ok();
    }
}
