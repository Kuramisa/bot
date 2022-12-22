import Item from "#schemas/Item";
import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";

export class ShopCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "shop",
            description: "Use your Ryo to buy things here",
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

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { database } = this.container;

        const { options, user } = interaction;

        const db = await database.users.get(user);

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
                        ephemeral: true,
                    });
                if (!item.price)
                    return interaction.reply({
                        content: "This item does not have a price",
                        ephemeral: true,
                    });

                const needsToPay = item.price * buyCount;

                if (db.currencies.ryo < needsToPay)
                    return interaction.reply({
                        content: `You do not have enough Ryo to buy **${item.name}**`,
                        ephemeral: true,
                    });

                item.amount = buyCount;

                db.inventory.items.push(item);
                db.currencies.ryo -= needsToPay;
                await db.save();

                return interaction.reply({
                    content: `Bought ${buyCount} **${item.name}** for ${needsToPay} Ryo`,
                    ephemeral: true,
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
                        ephemeral: true,
                    });
                if (!item.price)
                    return interaction.reply({
                        content: "This item does not have a price",
                        ephemeral: true,
                    });

                const owned = db.inventory.items.find(
                    (it) => item.id === it.id
                );
                if (!owned || !owned.amount)
                    return interaction.reply({
                        content: `You do not own any **${item.name}**`,
                        ephemeral: true,
                    });

                if (sellCount > owned.amount)
                    return interaction.reply({
                        content: `You do not have enough items to sell, you have ${owned.amount} **${item.name}**`,
                        ephemeral: true,
                    });

                const sellPrice = (item.price * sellCount) / 2;

                if (owned.amount < 2) {
                    db.inventory.items = db.inventory.items.filter(
                        (it) => it.id !== item.id
                    );
                } else {
                    owned.amount -= sellCount;
                }

                db.markModified("items");
                await db.save();

                return interaction.reply({
                    content: `Sold ${sellCount} **${item.name}** for ${sellPrice} Ryo`,
                    ephemeral: true,
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
                        ephemeral: true,
                    });
                if (!item.price)
                    return interaction.reply({
                        content: "This item does not have a price",
                        ephemeral: true,
                    });

                const owned = db.inventory.items.find(
                    (it) => it.id === item.id
                );

                if (!owned || !owned.amount)
                    return interaction.reply({
                        content: `You do not own any **${item.name}**`,
                        ephemeral: true,
                    });

                if (owned.amount < 2) {
                    db.inventory.items = db.inventory.items.filter(
                        (it) => it.id === item.id
                    );
                } else {
                    owned.amount -= discardCount;
                }

                db.markModified("items");
                await db.save();

                return interaction.reply({
                    content: `Discarded ${discardCount} **${item.name}**`,
                    ephemeral: true,
                });
            }
        }
    }
}
