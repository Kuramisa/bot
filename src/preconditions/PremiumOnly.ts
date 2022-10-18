import { Piece, Precondition } from "@sapphire/framework";
import {
    CommandInteraction,
    ContextMenuInteraction,
    Message,
    Guild,
    User
} from "discord.js";

export class PremiumOnlyPrecondition extends Precondition {
    constructor(ctx: Piece.Context, opts: Precondition.Options) {
        super(ctx, {
            ...opts,
            name: "PremiumOnly"
        });
    }

    public override async messageRun(message: Message<true>) {
        const resultUser = await this.checkPremiumUser(message.author);
        const resultGuild = await this.checkPremiumGuild(message.guild);

        return resultUser.isOk() || resultGuild.isOk()
            ? this.ok()
            : this.error({ message: "Guild or User not premium" });
    }

    public override async chatInputRun(
        interaction: CommandInteraction<"cached">
    ) {
        const resultUser = await this.checkPremiumUser(interaction.user);
        const resultGuild = await this.checkPremiumGuild(interaction.guild);

        return resultUser.isOk() || resultGuild.isOk()
            ? this.ok()
            : this.error({ message: "User or Server not premium" });
    }

    public override async contextMenuRun(
        interaction: ContextMenuInteraction<"cached">
    ) {
        const resultUser = await this.checkPremiumUser(interaction.user);
        const resultGuild = await this.checkPremiumGuild(interaction.guild);

        return resultUser.isOk() || resultGuild.isOk()
            ? this.ok()
            : this.error({ message: "Guild or User not premium" });
    }

    private async checkPremiumGuild(guild: Guild) {
        const { database } = this.container;

        const db = await database.guilds.get(guild);
        if (!db)
            return this.error({
                message: "Guild not found"
            });

        if (!db.premium)
            return this.error({
                message: "Guild not premium"
            });

        return this.ok();
    }

    private async checkPremiumUser(user: User) {
        const { database } = this.container;

        const db = await database.users.get(user);
        if (!db)
            return this.error({
                message: "User not found"
            });

        if (!db.premium)
            return this.error({
                message: "User not premium"
            });

        return this.ok();
    }
}
