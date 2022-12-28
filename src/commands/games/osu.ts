import { Args, Command } from "@sapphire/framework";
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    Message,
} from "discord.js";
import moment from "moment";
import { User } from "node-osu";

export class OsuCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "osu",
            description: "Osu! Helper",
        });
    }

    /**
     * Register Slash Command
     */
    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .addStringOption((option) =>
                    option
                        .setName("player")
                        .setDescription("Username of Osu Player")
                        .setRequired(true)
                )
        );
    }

    /**
     * Execute Message Command
     */
    async messageRun(message: Message, args: Args) {
        const player = await args.pick("string").catch(() => null);

        if (!player) return message.reply("Provide a player name");

        const {
            games: { osu },
        } = this.container;

        try {
            const user = await osu.getUser({ u: player });

            return this.createMessage(message, user);
        } catch (err) {
            return message.reply(`\`\`\`xl\n${err}\`\`\``);
        }
    }

    /**
     * Execute Slash Command
     */
    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const {
            games: { osu },
        } = this.container;

        const player = interaction.options.getString("player", true);

        try {
            const user = await osu.getUser({ u: player });

            return this.createMessage(interaction, user);
        } catch (err) {
            return interaction.reply({
                content: `\`\`\`xl\n${err}\`\`\``,
                ephemeral: true,
            });
        }
    }

    private async createMessage(
        interaction: Message | ChatInputCommandInteraction,
        user: User
    ) {
        const { games, util } = this.container;

        const embed = util
            .embed()
            .setAuthor({
                name: `Player: ${user.name} - Level: ${Math.round(user.level)}`,
            })
            .setDescription(
                `\`Accuracy\`: ${
                    user.accuracyFormatted
                }\n\`Time Played\`: ${util.msToDur(
                    user.secondsPlayed
                )}\n\`Joined\`: ${moment(user.joinDate).format(
                    "MMMM Do YYYY H:mm:ss a"
                )}\n\`Total Plays\`: ${user.counts.plays}`
            )
            .addFields(
                {
                    name: "Ranks",
                    value: `*Global*: ${user.pp.rank}\n*Country Rank*: ${user.pp.countryRank}`,
                    inline: true,
                },
                {
                    name: "Plays",
                    value: `*SS*: ${user.counts.SS}\n*S*: ${user.counts.S}\n*A*: ${user.counts.A}`,
                    inline: true,
                },
                {
                    name: "Hits",
                    value: `*300*: ${user.counts["300"]}\n*100*: ${user.counts["100"]}\n*50*: ${user.counts["50"]}`,
                    inline: true,
                }
            );

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("best-user-beatmaps")
                    .setLabel("Best Beatmaps")
                    .setStyle(ButtonStyle.Primary)
            );

        const message = await interaction.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.customId === "best-user-beatmaps",
        });

        collector.on("collect", async (i) => {
            try {
                switch (i.customId) {
                    case "best-user-beatmaps": {
                        const userBest = await games.osu.getUserBest({
                            u: user.name,
                        });

                        const scores = userBest
                            .sort((a, b) => b.score - a.score)
                            .map(
                                (score, i) => `
                                #${i + 1} ${util.embedURL(
                                    `**${score.beatmap.artist}** - ${score.beatmap.title}`,
                                    `https://osu.ppy.sh/beatmapsets/${score.beatmap.beatmapSetId}#osu/${score.beatmap.id}`
                                )}
                                **Score**: ${util.formatNumber(score.score)}
                                **Accuracy**: ${Math.round(
                                    util.calcPercentage(score.accuracy)
                                )}%
                                **Rank**: ${score.rank}
                                **Max Combo**: ${score.maxCombo}
                                **Star Rating**: ${
                                    Math.round(
                                        score.beatmap.difficulty.rating * 10
                                    ) / 10
                                }
                                **BPM**: ${score.beatmap.bpm}`
                            );

                        await util.pagination.default(
                            i,
                            scores,
                            `${user.name} Best Beatmaps`,
                            true
                        );
                        break;
                    }
                }
            } catch (err) {
                await i.reply({
                    content: `\`\`\`xl\n${err}\`\`\``,
                    ephemeral: true,
                });
            }
            collector.resetTimer();
        });
    }
}
