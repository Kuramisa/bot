import { Command } from "@sapphire/framework";
import {
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ComponentType
} from "discord.js";

export class VCConvertCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "vcconvert",
            description: "Convert a voice to a dynamic one",
            requiredClientPermissions: "ManageChannels",
            requiredUserPermissions: "ManageChannels",
            preconditions: ["PremiumOnly"]
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .setDefaultMemberPermissions(1 << 5)
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { database, util } = this.container;

        const { guild } = interaction;
        if (!guild) return;

        const db = await database.guilds.get(guild);
        if (!db) return;

        const message = await interaction.deferReply({ fetchReply: true });

        const voiceChannels = util._.chunk(
            guild.channels.cache
                .filter((ch) => ch.type === ChannelType.GuildVoice)
                .toJSON(),
            25
        );

        let page = 0;

        const rows: any[] = [];
        for (let i = 0; i < voiceChannels.length; i++) {
            const channels = voiceChannels[i];
            const options = [];
            for (let j = 0; j < channels.length; j++) {
                const channel = channels[j];
                if (
                    db.dvc.some((vc) => vc.parent === channel.id) ||
                    db.dvc.some((vc) => vc.channels.includes(channel.id))
                )
                    continue;

                options.push({ label: channel.name, value: channel.id });
            }

            rows.push(
                util
                    .row()
                    .setComponents(
                        util
                            .dropdown()
                            .setCustomId(`convert-channels-${i}`)
                            .setOptions(options)
                            .setMinValues(1)
                            .setMaxValues(options.length)
                    )
            );
        }

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("convert-go-back")
                    .setLabel("Go back")
                    .setStyle(ButtonStyle.Danger),
                util
                    .button()
                    .setCustomId("convert-load-more")
                    .setLabel("Load More")
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.editReply({
            components: rows.length > 1 ? [rows[page], row] : [rows[page]]
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) =>
                (i.customId === "convert-go-back" ||
                    i.customId === "convert-load-more") &&
                i.user.id === interaction.user.id
        });

        collector.on("collect", async (i) => {
            switch (i.customId) {
                case "convert-go-back": {
                    page = page > 0 ? --page : rows.length - 1;
                    break;
                }
                case "convert-load-more": {
                    page = page + 1 < rows.length ? ++page : 0;
                    break;
                }
                default:
                    break;
            }

            await i.deferUpdate();
            await i.update({
                components: rows.length > 1 ? [rows[page], row] : [rows[page]]
            });
        });

        const sInteraction = await message.awaitMessageComponent({
            componentType: ComponentType.SelectMenu,
            filter: (i) =>
                i.customId.includes("convert-channels") &&
                i.user.id === interaction.user.id
        });

        await sInteraction.deferUpdate();

        const alreadyExists = [];

        for (let i = 0; i < sInteraction.values.length; i++) {
            const value = sInteraction.values[i];
            db.dvc.push({ parent: value, channels: [] });
        }

        const embed = util
            .embed()
            .setTitle("Voice Channel Conversion")
            .setDescription(
                `Voice channels converted to Dynamic voice channels\n${sInteraction.values
                    .map((value) => `<#${value}>`)
                    .join("\n")}`
            );

        await db.save();

        await message.edit({ embeds: [embed], components: [] });
    }
}
