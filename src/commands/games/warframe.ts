import { Args } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { ButtonStyle, ChatInputCommandInteraction, Message } from "discord.js";
import moment from "moment";
import { Platform } from "warframe-market/lib/typings";

export class WarframCommand extends Subcommand {
    constructor(ctx: Subcommand.Context, opts: Subcommand.Options) {
        super(ctx, {
            ...opts,
            name: "warframe",
            description: "Warframe Helper",
            subcommands: [
                {
                    name: "market",
                    messageRun: "messageMarket",
                    chatInputRun: "chatInputMarket"
                }
            ]
        });
    }

    override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((command) =>
                    command
                        .setName("market")
                        .setDescription("Access Warframe.market")
                        .addStringOption((option) =>
                            option
                                .setName("item")
                                .setDescription("Item to search")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("user_status")
                                .setDescription(
                                    "Status for the user that placed the order"
                                )
                                .addChoices(
                                    { name: "In Game", value: "ingame" },
                                    { name: "On Site", value: "online" }
                                )
                        )
                )
        );
    }

    /**
     * Execute Message Subcommand (Market)
     */
    async messageMarket(message: Message, args: Args) {
        const {
            games: { warframe },
            util
        } = this.container;
        const { author } = message;

        const itemName = await args.pick("string").catch(() => undefined);

        if (!itemName) return message.reply("Provide an item name");

        const items = await warframe.market.Items.GetItemOrdersAsync(
            itemName.toLowerCase().replace(/ /g, "_"),
            Platform.PC
        );

        if (items.error)
            return message.reply(`No orders for **${itemName}** found`);

        let orders = items.payload.orders
            .sort((a, b) => a.platinum - b.platinum)
            .sort(
                (a, b) =>
                    moment(b.creation_date).unix() -
                    moment(a.creation_date).unix()
            );

        const userStatus = await args.pick("string").catch(() => undefined);

        if (userStatus) {
            if (userStatus !== "ingame" && userStatus !== "online")
                return message.reply("Status can be `ingame` or `online`");
            orders = orders.filter((order) => order.user.status === userStatus);
        }

        let page = 0;

        const typeButtons = [
            util
                .button()
                .setCustomId("orders_sellers")
                .setLabel("Sellers")
                .setStyle(ButtonStyle.Primary),
            util
                .button()
                .setCustomId("orders_buyers")
                .setLabel("Buyers")
                .setStyle(ButtonStyle.Success)
        ];

        const navButtons = [
            util
                .button()
                .setCustomId("previous_order")
                .setLabel("Order")
                .setEmoji("⬅️")
                .setStyle(ButtonStyle.Secondary),
            util
                .button()
                .setCustomId("next_order")
                .setLabel("Order")
                .setEmoji("➡️")
                .setStyle(ButtonStyle.Secondary)
        ];

        const bottomButtons = [
            util
                .button()
                .setCustomId("create_paste")
                .setLabel("Create Paste")
                .setStyle(ButtonStyle.Success)
        ];

        const typeRow = util.row().setComponents(typeButtons);
        const navRow = util.row().setComponents(navButtons);
        const bottomRow = util.row().setComponents(bottomButtons);

        const sellerEmbeds = orders
            .filter((order) => order.order_type === "sell")
            .map((order, index) => {
                const embed = util
                    .embed()
                    .setTitle(`Sell Orders for ${itemName}`)
                    .setDescription(
                        `
                    \`Cost\`: ${order.platinum} (each)
                    \`Quantity\`: ${order.quantity}
                    \`Last Updated\`: <t:${moment(order.last_update).unix()}:R>
                    \`Created\`: <t:${moment(order.creation_date).unix()}:R>
                `
                    )
                    .addFields({
                        name: "Seller",
                        value: `
                    \`In Game Name\`: ${order.user.ingame_name}
                    \`Reputation\`: ${order.user.reputation}
                    \`Status\`: ${util.capFirstLetter(order.user.status)}
                    \`Last Seen\`*: <t:${moment(order.user.last_seen).unix()}:R>
                `
                    })
                    .setFooter({
                        text: `Page ${index + 1} of ${orders.length}`
                    });

                return embed;
            });

        const buyerEmbeds = orders
            .filter((order) => order.order_type === "buy")
            .map((order, index) => {
                const embed = util
                    .embed()
                    .setTitle(`Buy Orders for ${itemName}`)
                    .setDescription(
                        `
                    \`Cost\`: ${order.platinum} (each)
                    \`Quantity\`: ${order.quantity}
                    \`Last Updated\`: <t:${moment(order.last_update).unix()}:R>
                    \`Created\`: <t:${moment(order.creation_date).unix()}:R>
                `
                    )
                    .addFields({
                        name: "Buyer",
                        value: `
                    \`In Game Name\`: ${order.user.ingame_name}
                    \`Reputation\`: ${order.user.reputation}
                    \`Status\`: ${util.capFirstLetter(order.user.status)}
                    \`Last Seen\`*: <t:${moment(order.user.last_seen).unix()}:R>
                `
                    })
                    .setFooter({
                        text: `Page ${index + 1} of ${orders.length}`
                    });

                return embed;
            });

        let embeds = sellerEmbeds;

        const msg = await message.reply({
            embeds: [sellerEmbeds[page]],
            components: [typeRow, navRow, bottomRow]
        });

        const collector = msg.createMessageComponentCollector({
            filter: (i) =>
                (i.customId === "orders_sellers" ||
                    i.customId === "orders_buyers" ||
                    i.customId === "previous_order" ||
                    i.customId === "next_order") &&
                i.user.id === author.id
        });

        collector.on("collect", async (i) => {
            switch (i.customId) {
                case "orders_sellers": {
                    embeds = sellerEmbeds;
                    break;
                }
                case "orders_buyers": {
                    embeds = buyerEmbeds;
                    break;
                }
                case "previous_order": {
                    page = page > 0 ? --page : embeds.length - 1;
                    break;
                }
                case "next_order": {
                    page = page + 1 < embeds.length ? ++page : 0;
                    break;
                }
                default:
                    break;
            }

            await i.deferUpdate();
            await i.editReply({
                embeds: [embeds[page]],
                components: [typeRow, navRow, bottomRow]
            });

            collector.resetTimer();
        });
    }

    /**
     * Execute Slash Subcommand (Market)
     */
    chatInputMarket = (interaction: ChatInputCommandInteraction<"cached">) =>
        this.container.games.warframe.orders(interaction);
}
