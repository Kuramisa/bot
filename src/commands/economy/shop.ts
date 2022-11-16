import Item from "#schemas/Item";
import { Command } from "@sapphire/framework";

export class ShopCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "shop",
            description: "Use your Ryo to buy things here"
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((command) =>
                    command
                        .setName("buy")
                        .setDescription("Buy items from the shop")
                        .addStringOption((option) =>
                            option
                                .setName("buyable_item")
                                .setDescription("Buyable item from the shop")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addNumberOption((option) =>
                            option
                                .setName("buy_count")
                                .setDescription(
                                    "How many of this item you want to buy?"
                                )
                                .setRequired(false)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("sell")
                        .setDescription("Sell items to the shop (half price)")
                        .addStringOption((option) =>
                            option
                                .setName("sellable_item")
                                .setDescription(
                                    "Sellable item (some items do not have a price)"
                                )
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addNumberOption((option) =>
                            option
                                .setName("sell_count")
                                .setDescription(
                                    "How many of this item you want to sell?"
                                )
                                .setRequired(false)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("discard")
                        .setDescription("Discard items to the shop")
                        .addStringOption((option) =>
                            option
                                .setName("discardable_item")
                                .setDescription("Discardable item")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                        .addNumberOption((option) =>
                            option
                                .setName("discard_count")
                                .setDescription(
                                    "How many of this item you want to discard?"
                                )
                                .setRequired(false)
                        )
                )
        );
    }

    async chatInputRun(interaction: Command.ChatInputInteraction) {
        const { database } = this.container;

        const { options, user } = interaction;

        const db = await database.users.get(user);
        if (!db) return;

        switch (options.getSubcommand()) {
            case "buy": {
                const itemId = options.getString("buyable_item", true);
                const buyCount = options.getNumber("buy_count")
                    ? options.getNumber("buy_count", true)
                    : 1;

                const item = await Item.findOne({ id: itemId });
                if (!item)
                    return interaction.reply({
                        content: "That item does not exist",
                        ephemeral: true
                    });
                if (!item.price)
                    return interaction.reply({
                        content: "This item does not have a price",
                        ephemeral: true
                    });

                const needsToPay = item.price * buyCount;

                if (db.currencies.ryo < needsToPay)
                    return interaction.reply({
                        content: `You do not have enough Ryo to buy **${item.name}**`,
                        ephemeral: true
                    });

                db.items.push(item);
                db.currencies.ryo -= needsToPay;
                await db.save();

                return interaction.reply({
                    content: `Bought ${buyCount} **${item.name}**`,
                    ephemeral: true
                });
            }
            case "sell": {
                const itemId = options.getString("sellable_item", true);
                const sellCount = options.getNumber("sell_count")
                    ? options.getNumber("sell_count", true)
                    : 1;

                const item = await Item.findOne({ id: itemId });
                if (!item)
                    return interaction.reply({
                        content: "That item does not exist",
                        ephemeral: true
                    });
                if (!item.price)
                    return interaction.reply({
                        content: "This item does not have a price",
                        ephemeral: true
                    });

                const sellPrice = (item.price * sellCount) / 2;

                return interaction.reply({
                    content: `Sold ${sellCount} **${item.name}**`,
                    ephemeral: true
                });
            }
            case "discard": {
                const itemId = options.getString("discardable_item", true);
                const discardCount = options.getNumber("discard_count")
                    ? options.getNumber("discard_count", true)
                    : 1;

                const item = await Item.findOne({ id: itemId });
                if (!item)
                    return interaction.reply({
                        content: "That item does not exist",
                        ephemeral: true
                    });
                if (!item.price)
                    return interaction.reply({
                        content: "This item does not have a price",
                        ephemeral: true
                    });

                return interaction.reply({
                    content: `Discarded ${discardCount} **${item.name}**`,
                    ephemeral: true
                });
            }
        }
    }
}
