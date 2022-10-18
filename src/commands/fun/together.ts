import { Args, Command } from "@sapphire/framework";
import { TogetherApplications } from "@types";
import { Message } from "discord.js";

export class TogetherCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "together",
            description: "Play/Watch things together"
        });
    }

    /**
     * Register Slash Command
     */
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .addStringOption((option) =>
                    option
                        .setName("activity")
                        .setDescription("Choose an activity")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        );
    }

    /**
     * Execute Message Command
     */
    public async messageRun(message: Message, args: Args) {
        const { member } = message;

        if (!member) return;
        if (!member.voice.channel)
            return message.reply(
                "You have to be in a voice channel to start an activity"
            );

        const activity = await args.pick("string").catch(() => null);

        const {
            systems: { together }
        } = this.container;

        if (!activity)
            return message.reply(
                `Please provide an activity to start\n**List of activities**:\n\`\`\`${Object.keys(
                    together.applications
                )
                    .map((app) => `${app}`)
                    .join(", ")}\`\`\``
            );

        if (
            !together.applications[
                activity as keyof typeof together.applications
            ]
        )
            return message.reply("Activity does not exist");

        const inviteURL = await together.createCode(
            member.voice.channel,
            activity as keyof TogetherApplications
        );

        return message.reply(inviteURL);
    }

    public async chatInputRun(
        interaction: Command.ChatInputInteraction<"cached">
    ) {
        const {
            systems: { together }
        } = this.container;
        const { member, options } = interaction;

        if (!member.voice.channel)
            return interaction.reply({
                content:
                    "You have to be in a voice channel to start an activity",
                ephemeral: true
            });

        const activity = options.getString("activity", true);

        const applications = together.applications;

        if (!applications[activity as keyof typeof applications])
            return interaction.reply({
                content: "Activity does not exist",
                ephemeral: true
            });

        const inviteURL = await together.createCode(
            member.voice.channel,
            activity as keyof TogetherApplications
        );

        return interaction.reply(inviteURL);
    }
}
