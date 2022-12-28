import { Piece, Precondition } from "@sapphire/framework";
import {
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    Guild,
    Message,
    User,
} from "discord.js";

export class PremiumOnlyPrecondition extends Precondition {
    constructor(ctx: Piece.Context, opts: Precondition.Options) {
        super(ctx, {
            ...opts,
            name: "PremiumOnly",
        });
    }

    override async messageRun(message: Message) {
        const resultUser = await this.checkPremium(message.author);
        const resultGuild = await this.checkPremium(message.guild);

        return resultUser.isOk() || resultGuild.isOk()
            ? this.ok()
            : this.error({ message: "Guild or User not premium" });
    }

    override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const resultUser = await this.checkPremium(interaction.user);
        const resultGuild = await this.checkPremium(interaction.guild);

        return resultUser.isOk() || resultGuild.isOk()
            ? this.ok()
            : this.error({ message: "User or Server not premium" });
    }

    override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
        const resultUser = await this.checkPremium(interaction.user);
        const resultGuild = await this.checkPremium(interaction.guild);

        return resultUser.isOk() || resultGuild.isOk()
            ? this.ok()
            : this.error({ message: "Guild or User not premium" });
    }

    private async checkPremium(checkFor: Guild | User | null) {
        const { database, owners } = this.container;

        if (checkFor instanceof Guild) {
            const db = await database.guilds.get(checkFor);
            if (!db)
                return this.error({
                    message: "Guild not found",
                });

            if (!db.premium)
                return this.error({
                    message: "Guild not premium",
                });

            return this.ok();
        } else if (checkFor instanceof User) {
            if (owners.includes(checkFor.id)) return this.ok();
            const db = await database.users.get(checkFor);
            if (!db)
                return this.error({
                    message: "User not found",
                });

            if (!db.premium)
                return this.error({
                    message: "User not premium",
                });

            return this.ok();
        }

        return this.error({ message: "Something went wrong" });
    }
}
