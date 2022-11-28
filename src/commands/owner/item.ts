import { Command } from "@sapphire/framework";
import Item from "#schemas/Item";
import { ChatInputCommandInteraction } from "discord.js";

export class MarryCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "item",
            description: "Item System",
            preconditions: ["OwnerOnly"]
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDMPermission(false)
                .addSubcommand((command) =>
                    command
                        .setName("add")
                        .setDescription("Add an item")
                        .addStringOption((option) =>
                            option
                                .setName("item_name")
                                .setDescription("Name of an item")
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("item_description")
                                .setDescription("Description of an item")
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName("item_usage")
                                .setDescription("Usage of an item")
                                .setRequired(true)
                        )
                        .addNumberOption((option) =>
                            option
                                .setName("item_price")
                                .setDescription(
                                    "Price of an item (if it has one)"
                                )
                                .setRequired(false)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("remove")
                        .setDescription("Remove an item")
                        .addStringOption((option) =>
                            option
                                .setName("item_name")
                                .setDescription("Item name to remove")
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { util } = this.container;

        const { options } = interaction;

        switch (options.getSubcommand()) {
            case "add": {
                const name = options.getString("item_name", true);
                const id = name.toLowerCase().split(" ").join("_");
                const description = options.getString("item_description", true);
                const usage = options.getString("item_usage", true);
                const price = options.getNumber("item_price");

                await Item.create({
                    id,
                    name,
                    description,
                    usage,
                    price
                });

                const embed = util
                    .embed()
                    .setTitle("Created an item")
                    .addFields(
                        { name: "ID", value: id, inline: true },
                        { name: "Name", value: name, inline: true },
                        {
                            name: "Description",
                            value: description,
                            inline: true
                        },
                        { name: "Usage", value: usage, inline: true },
                        {
                            name: "Price",
                            value: price ? `${price}` : "None",
                            inline: true
                        }
                    );

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            case "remove": {
                const name = options.getString("item_name", true);

                await Item.deleteOne({ id: name.split(":")[1] });

                return interaction.reply({
                    content: `Removed item **${name.split(":")[0]}**`,
                    ephemeral: true
                });
            }
        }
    }
}
