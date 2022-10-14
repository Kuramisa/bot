import { Command } from "@sapphire/framework";
import { Message } from "discord.js";

export class XPCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "xp",
            description: "Check your XP"
        });
    }

    /**
     * Register Slash Command
     */
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
    }

    /**
     * Execute Message Command
     */
    public async messageRun(message: Message) {
        const { author: user } = message;

        if (!user) return message.reply("User not found");

        const xp = await this.container.xp.getXP(user);
        const level = await this.container.xp.getLevel(user);
        const requiredXP = this.container.xp.calculateReqXP(level as number);

        return message.reply(
            `\`Level\`: ${level}\n\`XP\`: ${xp}\n\`Required XP\`: ${requiredXP}`
        );
    }

    /**
     * Execute Slash Command
     */
    public async chatInputCommand(interaction: Command.ChatInputInteraction) {
        const { user } = interaction;

        const xp = await this.container.xp.getXP(user);
        const level = await this.container.xp.getLevel(user);
        const requiredXP = this.container.xp.calculateReqXP(level as number);

        return interaction.reply(
            `\`Level\`: ${level}\n\`XP\`: ${xp}\n\`Required XP\`: ${requiredXP}`
        );
    }
}
