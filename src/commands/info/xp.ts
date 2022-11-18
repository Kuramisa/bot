import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, Message } from "discord.js";

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
    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
    }

    /**
     * Execute Message Command
     */
    async messageRun(message: Message) {
        const {
            systems: { xp }
        } = this.container;

        const { author: user } = message;

        if (!user) return message.reply("User not found");

        const eXp = await xp.getXP(user);
        const level = await xp.getLevel(user);
        const requiredXP = xp.calculateReqXP(level as number);

        return message.reply(
            `\`Level\`: ${level}\n\`XP\`: ${eXp}\n\`Required XP\`: ${requiredXP}`
        );
    }

    /**
     * Execute Slash Command
     */
    async chatInputCommand(interaction: ChatInputCommandInteraction) {
        const {
            systems: { xp }
        } = this.container;

        const { user } = interaction;

        const eXp = await xp.getXP(user);
        const level = await xp.getLevel(user);
        const requiredXP = xp.calculateReqXP(level as number);

        return interaction.reply(
            `\`Level\`: ${level}\n\`XP\`: ${eXp}\n\`Required XP\`: ${requiredXP}`
        );
    }
}
