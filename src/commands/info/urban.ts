import { Args, Command } from "@sapphire/framework";
import axios, { AxiosRequestConfig } from "axios";
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    Message,
} from "discord.js";

const { RAPID_API } = process.env;

export class UrbanCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "urban",
            description: "Access Urban Dictionary",
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption((option) =>
                    option
                        .setName("word")
                        .setDescription("Word to find in the dictionary")
                        .setRequired(true)
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { util } = this.container;

        const word = interaction.options.getString("word", true);

        const list = await this.fetchWord(word);

        if (!list)
            return interaction.reply({
                content: "Could not find any definitions",
                ephemeral: true,
            });

        await interaction.deferReply();

        let page = 0;

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("previous_page")
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Secondary),
                util
                    .button()
                    .setCustomId("next_page")
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Secondary)
            );

        const embeds = list.map((def: any, i: number) =>
            util
                .embed()
                .setAuthor({ name: def.author, url: def.permalink })
                .setTitle(def.word)
                .setDescription(def.definition)
                .setFields(
                    {
                        name: "Likes",
                        value: String(def.thumbs_up),
                        inline: true,
                    },
                    {
                        name: "Dislikes",
                        value: String(def.thumbs_down),
                        inline: true,
                    },
                    { name: "Example", value: def.example }
                )
                .setFooter({ text: `Definition ${i} of ${list.length}` })
        );

        const message = await interaction.editReply({
            embeds: [embeds[page]],
            components: [row],
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) =>
                (i.customId === "previous_page" ||
                    i.customId === "next_page") &&
                i.user.id === interaction.user.id,
            time: 15000,
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "previous_page":
                        page = page > 0 ? --page : embeds.length - 1;
                        break;
                    case "next_page":
                        page = page + 1 < embeds.length ? ++page : 0;
                        break;
                    default:
                        break;
                }

                await i.deferUpdate();
                await i.editReply({
                    embeds: [embeds[page]],
                    components: [row],
                });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete")
                    message.delete().catch(console.error);
            });
    }

    async messageRun(message: Message, args: Args) {
        const { util } = this.container;

        const word = await args.pick("string").catch(() => null);

        if (!word) return message.reply("Please provide a word to search for");

        const list = await this.fetchWord(word);

        if (!list) return message.reply("Could not find any definitions");

        let page = 0;

        const row = util
            .row()
            .setComponents(
                util
                    .button()
                    .setCustomId("previous_page")
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Secondary),
                util
                    .button()
                    .setCustomId("next_page")
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Secondary)
            );

        const embeds = list.map((def: any, i: number) =>
            util
                .embed()
                .setAuthor({ name: def.author, url: def.permalink })
                .setTitle(def.word)
                .setDescription(def.definition)
                .setFields(
                    {
                        name: "Likes",
                        value: String(def.thumbs_up),
                        inline: true,
                    },
                    {
                        name: "Dislikes",
                        value: String(def.thumbs_down),
                        inline: true,
                    },
                    { name: "Example", value: def.example }
                )
                .setFooter({ text: `Definition ${i} of ${list.length}` })
        );

        const msg = await message.reply({
            embeds: [embeds[page]],
            components: [row],
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) =>
                (i.customId === "previous_page" ||
                    i.customId === "next_page") &&
                i.user.id === message.author.id,
            time: 15000,
        });

        collector
            .on("collect", async (i) => {
                switch (i.customId) {
                    case "previous_page":
                        page = page > 0 ? --page : embeds.length - 1;
                        break;
                    case "next_page":
                        page = page + 1 < embeds.length ? ++page : 0;
                        break;
                    default:
                        break;
                }

                await i.deferUpdate();
                await i.editReply({
                    embeds: [embeds[page]],
                    components: [row],
                });

                collector.resetTimer();
            })
            .on("end", (_, reason) => {
                if (reason !== "messageDelete")
                    message.delete().catch(console.error);
            });
    }

    private async fetchWord(word: string) {
        const opts: AxiosRequestConfig = {
            method: "GET",
            url: "https://mashape-community-urban-dictionary.p.rapidapi.com/define",
            params: { term: word },
            headers: {
                "X-RapidAPI-Key": RAPID_API as string,
                "X-RapidAPI-Host":
                    "mashape-community-urban-dictionary.p.rapidapi.com",
            },
        };

        const { data: { list } = [] } = await axios.request(opts);

        if (list.length < 1) return null;

        return list;
    }
}
