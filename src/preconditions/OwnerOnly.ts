import { Piece, Precondition } from "@sapphire/framework";
import {
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    Message
} from "discord.js";

export class OwnerOnlyPrecondition extends Precondition {
    constructor(ctx: Piece.Context, opts: Precondition.Options) {
        super(ctx, {
            ...opts,
            name: "OwnerOnly"
        });
    }

    override messageRun = (message: Message) =>
        this.checkOwner(message.author.id);

    override chatInputRun = (interaction: ChatInputCommandInteraction) =>
        this.checkOwner(interaction.user.id);

    override contextMenuRun = (interaction: ContextMenuCommandInteraction) =>
        this.checkOwner(interaction.user.id);

    private checkOwner = (userId: string) =>
        this.container.owners.includes(userId)
            ? this.ok()
            : this.error({
                  message: "Only the bot owners can use this command"
              });
}
