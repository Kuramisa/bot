import { Command } from "@sapphire/framework";
import {
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
} from "discord.js";

export class ShinobiCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "sh",
            description: "Shinobi Adventure Game",
            aliases: ["shinobi"],
            preconditions: ["BetaTesterOnly"],
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
                        .setName("start")
                        .setDescription("Start your adventure")
                )
                .addSubcommand((command) =>
                    command.setName("me").setDescription("Your Shinobi Info")
                )
                .addSubcommand((command) =>
                    command
                        .setName("fight")
                        .setDescription("Fight another shinobi")
                        .addStringOption((option) =>
                            option
                                .setName("player")
                                .setDescription("Player to fight")
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("players")
                        .setDescription("Shinobi Players")
                        .addStringOption((option) =>
                            option
                                .setName("player")
                                .setAutocomplete(true)
                                .setDescription("Player to view info of")
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("delete")
                        .setDescription("Delete someone's progress")
                        .addStringOption((option) =>
                            option
                                .setName("player")
                                .setDescription(
                                    "Player to delete the progress of"
                                )
                                .setAutocomplete(true)
                                .setRequired(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("clans")
                        .setDescription("Shinobi Clans")
                        .addStringOption((option) =>
                            option
                                .setName("clan")
                                .setDescription("Clan to view")
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("villages")
                        .setDescription("Shinobi Villages")
                        .addStringOption((option) =>
                            option
                                .setName("village")
                                .setDescription("Village to view")
                                .setAutocomplete(true)
                        )
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName("weapons")
                        .setDescription("Weapon System")
                        .addSubcommand((command) =>
                            command
                                .setName("view")
                                .setDescription("View a weapon")
                                .addStringOption((option) =>
                                    option
                                        .setName("weapon")
                                        .setDescription("Weapon to view")
                                        .setAutocomplete(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("buy")
                                .setDescription("Buy a weapon")
                                .addStringOption((option) =>
                                    option
                                        .setName("weapon")
                                        .setDescription("Weapon to buy")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("sell")
                                .setDescription("Sell a weapon")
                                .addStringOption((option) =>
                                    option
                                        .setName("weapon")
                                        .setDescription("Weapon to sell")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                        .addSubcommand((command) =>
                            command
                                .setName("equip")
                                .setDescription("Equip a weapon")
                                .addStringOption((option) =>
                                    option
                                        .setName("weapon")
                                        .setDescription("Weapon to equip")
                                        .setAutocomplete(true)
                                        .setRequired(true)
                                )
                        )
                )
                .addSubcommand((command) =>
                    command
                        .setName("daily")
                        .setDescription("Claim your daily reward")
                )
                .addSubcommand((command) =>
                    command
                        .setName("weekly")
                        .setDescription("Claim your weekly reward")
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { options, user } = interaction;

        const {
            games: { shinobi },
        } = this.container;

        switch (options.getSubcommand()) {
            case "start":
                return shinobi.start(interaction);
            case "me":
                return shinobi.players.me(interaction);
            case "delete":
                return shinobi.delete(interaction);
            case "daily":
                return shinobi.daily(interaction);
            case "weekly":
                return shinobi.weekly(interaction);
            case "players": {
                const target = options.getString("player");

                if (!target) return shinobi.players.pagination(interaction);

                const player = shinobi.players.get(target);

                if (!player)
                    return interaction.reply({
                        content: `${target} is not a Shinobi`,
                        ephemeral: true,
                    });

                const embed = shinobi.players.embed(player);
                if (!embed) return;

                return interaction.reply({ embeds: [embed] });
            }
            case "clans": {
                const clanStr = options.getString("clan");

                if (!clanStr) {
                    return shinobi.clans.pagination(interaction);
                }

                const clan = shinobi.clans.get(clanStr);

                if (!clan)
                    return interaction.reply({
                        content: "Clan not found",
                        ephemeral: true,
                    });

                const embed = shinobi.clans.embed(clan);

                return interaction.reply({ embeds: [embed] });
            }
            case "villages": {
                const villageStr = options.getString("village");

                if (!villageStr)
                    return shinobi.villages.pagination(interaction);

                const village = shinobi.villages.get(villageStr);

                if (!village)
                    return interaction.reply({
                        content: "Village not found",
                        ephemeral: true,
                    });

                const embed = shinobi.villages.embed(village);

                return interaction.reply({ embeds: [embed] });
            }
        }

        switch (options.getSubcommandGroup()) {
            case "weapons": {
                const player = shinobi.players.get(user.id);

                if (!player)
                    return interaction.reply({
                        content:
                            "You have to be a Shinobi **view/buy/sell/equip** weapons",
                        ephemeral: true,
                    });

                const weaponStr = options.getString("weapon");

                if (!weaponStr && options.getSubcommand() === "view")
                    return shinobi.weapons.pagination(interaction);

                if (!weaponStr)
                    return interaction.reply({
                        content: "Please provide a weapon name",
                        ephemeral: true,
                    });

                const weapon = shinobi.weapons.get(weaponStr);
                if (!weapon)
                    return interaction.reply({
                        content: "Weapon not found",
                        ephemeral: true,
                    });

                switch (options.getSubcommand()) {
                    case "view": {
                        return interaction.reply({
                            embeds: [shinobi.weapons.embed(weapon)],
                        });
                    }
                    case "buy": {
                        return shinobi.weapons.buy(interaction, weapon);
                    }
                    case "sell": {
                        return shinobi.weapons.sell(interaction, weapon);
                    }
                    case "equip": {
                        return player.equip(interaction, weapon);
                    }
                }
            }
        }
    }

    async contextMenuRun(interaction: ContextMenuCommandInteraction) {
        const {
            client,
            games: { shinobi },
        } = this.container;

        const { targetId } = interaction;
        const user = await client.users.fetch(targetId);

        if (user.bot)
            return interaction.reply({
                content: `${user} is a bot`,
                ephemeral: true,
            });

        const player = shinobi.players.get(user.id);
        if (!player)
            return interaction.reply({
                content: `${user} is not a shinobi`,
                ephemeral: true,
            });

        const embed = shinobi.players.embed(player);
        if (!embed) return;

        return interaction.reply({ embeds: [embed] });
    }
}
