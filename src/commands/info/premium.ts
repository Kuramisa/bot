import { Command, PreconditionContainerSingle } from "@sapphire/framework";
import { Message } from "discord.js";

export class PremiumInfoCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "premium",
            aliases: ["exclusive"],
            description: "Information about Premium and it's features"
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description)
        );
    }

    /**
     * Execute Message Command
     */
    public async messageRun(message: Message) {
        const { client, util } = this.container;

        const info = util
            .embed()
            .setTitle(`${client.user?.username} - Premium Information`)
            .setDescription(
                "Premium comes with more commands, more perks, beta testing for the bot and many other features that you can have a previe of"
            );

        const commands = util
            .embed()
            .setTitle(`${client.user?.username} - Premium Commands`)
            .setDescription(this.getPremiumCommands());

        const prices = util
            .embed()
            .setTitle(`${client.user?.username} - Premium Prices`)
            .setDescription(
                "**Per Server**: *$9.99* ***Recommended***\n**Per User**: *$4.99*\n***These prices may change in the future, there will be a notice to all premium users if that happens***"
            );

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("prices_page")
                    .setLabel("Prices")
                    .setStyle("DANGER"),
                util
                    .button()
                    .setCustomId("info_page")
                    .setLabel("Info")
                    .setStyle("SECONDARY"),
                util
                    .button()
                    .setCustomId("commands_page")
                    .setLabel("Commands")
                    .setStyle("SUCCESS")
            );

        let currentEmbed = [info];

        const msg = await message.reply({
            embeds: currentEmbed,
            components: [row]
        });

        const collector = msg.createMessageComponentCollector({
            componentType: "BUTTON",
            filter: (i) =>
                (i.customId === "info_page" ||
                    i.customId === "prices_page" ||
                    i.customId === "commands_page") &&
                i.user.id === message.author.id,
            time: 30000
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "info_page":
                        currentEmbed = [info];
                        break;
                    case "prices_page":
                        currentEmbed = [prices];
                        break;
                    case "commands_page":
                        currentEmbed = [commands];
                        break;
                }

                await i.deferUpdate();
                await i.editReply({ embeds: currentEmbed });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete") msg.delete();
            });
    }

    public async chatInputRun(
        interaction: Command.ChatInputInteraction<"cached">
    ) {
        const { client, util } = this.container;

        const info = util
            .embed()
            .setTitle(`${client.user?.username} - Premium Information`)
            .setDescription(
                "Premium comes with more commands, more perks, beta testing for the bot and many other features that you can have a previe of"
            );

        const commands = util
            .embed()
            .setTitle(`${client.user?.username} - Premium Commands`)
            .setDescription(this.getPremiumCommands());

        const prices = util
            .embed()
            .setTitle(`${client.user?.username} - Premium Prices`)
            .setDescription(
                "**Per Server**: *$9.99* ***Recommended***\n**Per User**: *$4.99*\n\n***These prices may change in the future, there will be a notice to all premium users if that happens***"
            );

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("prices_page")
                    .setLabel("Prices")
                    .setStyle("DANGER"),
                util
                    .button()
                    .setCustomId("info_page")
                    .setLabel("Info")
                    .setStyle("SECONDARY"),
                util
                    .button()
                    .setCustomId("commands_page")
                    .setLabel("Commands")
                    .setStyle("SUCCESS")
            );

        let currentEmbed = [info];

        const msg = await interaction.reply({
            embeds: currentEmbed,
            components: [row],
            fetchReply: true
        });

        const collector = msg.createMessageComponentCollector({
            componentType: "BUTTON",
            filter: (i) =>
                (i.customId === "info_page" ||
                    i.customId === "prices_page" ||
                    i.customId === "commands_page") &&
                i.user.id === interaction.user.id,
            time: 30000
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "info_page":
                        currentEmbed = [info];
                        break;
                    case "prices_page":
                        currentEmbed = [prices];
                        break;
                    case "commands_page":
                        currentEmbed = [commands];
                        break;
                }

                await i.deferUpdate();
                await i.editReply({ embeds: currentEmbed });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete") msg.delete();
            });
    }

    private getPremiumCommands() {
        const commands = this.container.stores
            .get("commands")
            .filter((command) =>
                command.preconditions.entries.some(
                    (pre: any) => pre.name === "PremiumOnly"
                )
            );

        return commands
            .map((command) => `**${command.name}** - *${command.description}*`)
            .join("\n");
    }
}
