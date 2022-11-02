import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class ShinobiACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Shinobi Autocomplete",
            event: "interactionCreate"
        });
    }

    public async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "sh") return;

        const { games } = this.container;

        const { options, user } = interaction;

        const focused = options.getFocused().toLowerCase();

        if (options.get("clan")) {
            let clans = games.shinobi.clans.getAll();

            if (focused.length > 0)
                clans = clans.filter((item) =>
                    item.name.toLowerCase().startsWith(focused)
                );

            await interaction.respond(
                clans.map((clan) => ({ name: clan.name, value: clan.id }))
            );
        }

        if (options.get("village")) {
            let villages = games.shinobi.villages.getAll();

            if (focused.length > 0)
                villages = villages.filter(
                    (item) =>
                        item.name.en.toLowerCase().includes(focused) ||
                        item.name.jp.toLowerCase().includes(focused)
                );

            await interaction.respond(
                villages.map((village) => ({
                    name: `${village.name.en} (${village.name.jp})`,
                    value: village.id
                }))
            );
        }

        if (options.get("player")) {
            let players = games.shinobi.players.getAll();

            if (focused.length > 0)
                players = players.filter((player) =>
                    player.name.includes(focused)
                );

            await interaction.respond(
                players.map((player) => ({
                    name: `${player.name} | ${player.clan?.name} | ${player.village?.name.en} - ${player.rank}`,
                    value: player.id
                }))
            );
        }

        let weapons = games.shinobi.weapons.getAll();
        const player = games.shinobi.players.get(user.id);

        if (
            options.data.find((option) => option.type === "SUB_COMMAND_GROUP")
        ) {
            switch (options.getSubcommandGroup()) {
                case "weapons": {
                    switch (options.getSubcommand()) {
                        case "view": {
                            if (focused.length > 0)
                                weapons = weapons.filter(
                                    (item) =>
                                        item.id
                                            .toLowerCase()
                                            .startsWith(focused) ||
                                        item.name
                                            .toLowerCase()
                                            .startsWith(focused)
                                );

                            await interaction.respond(
                                weapons.map((weapon) => ({
                                    name: weapon.name,
                                    value: weapon.id
                                }))
                            );
                            break;
                        }
                        case "buy": {
                            if (player)
                                weapons = weapons.filter(
                                    (weapon) =>
                                        !player.weapons.some(
                                            (wp) => wp.id === weapon.id
                                        ) &&
                                        (weapon.id
                                            .toLowerCase()
                                            .startsWith(focused) ||
                                            weapon.name
                                                .toLowerCase()
                                                .startsWith(focused))
                                );

                            await interaction.respond(
                                weapons.map((weapon) => ({
                                    name: `${weapon.name} - ${weapon.cost} Ryo`,
                                    value: weapon.id
                                }))
                            );
                            break;
                        }
                        case "equip": {
                            if (player)
                                weapons = weapons.filter(
                                    (weapon) =>
                                        player.weapons.some(
                                            (wp) => wp.id === weapon.id
                                        ) &&
                                        (weapon.id
                                            .toLowerCase()
                                            .startsWith(focused) ||
                                            weapon.name
                                                .toLowerCase()
                                                .startsWith(focused))
                                );

                            await interaction.respond(
                                weapons.map((weapon) => ({
                                    name: `${weapon.name} - ${weapon.attack} Damage`,
                                    value: weapon.id
                                }))
                            );
                            break;
                        }
                        case "sell": {
                            if (player)
                                weapons = weapons.filter(
                                    (weapon) =>
                                        player.weapons.some(
                                            (wp) => wp.id === weapon.id
                                        ) &&
                                        (weapon.id
                                            .toLowerCase()
                                            .startsWith(focused) ||
                                            weapon.name
                                                .toLowerCase()
                                                .startsWith(focused))
                                );

                            await interaction.respond(
                                weapons.map((weapon) => ({
                                    name: `${weapon.name} - ${
                                        weapon.cost / 2
                                    } Ryo`,
                                    value: weapon.id
                                }))
                            );
                            break;
                        }
                    }
                }
            }
        }
    }
}
