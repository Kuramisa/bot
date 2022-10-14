import { Listener } from "@sapphire/framework";
import { AutocompleteInteraction } from "discord.js";

export class ValorantACListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Valorant Autocomplete",
            event: "interactionCreate"
        });
    }

    public async run(interaction: AutocompleteInteraction) {
        if (!interaction.isAutocomplete()) return;
        if (interaction.commandName !== "valorant") return;

        const { client, games, util } = this.container;
        const { options } = interaction;

        const focused = options.getFocused(true);

        switch (focused.name) {
            case "val_user": {
                let accounts = games.valorant.accounts;

                if (focused.value.length > 0)
                    accounts = accounts.filter((account) => {
                        const acct = account.player.acct;
                        return `${acct.game_name}#${acct.tag_line}`.startsWith(
                            focused.value
                        );
                    });

                const accts = accounts.first(25);

                return interaction.respond(
                    accts.map((account) => {
                        const player = account.player.acct;
                        const user = client.users.cache.get(account.memberId);

                        return {
                            name: `${player.game_name}#${player.tag_line} - ${user?.tag}`,
                            value: account.memberId
                        };
                    })
                );
            }
            case "act_rank": {
                const seasons = (await games.valorant.assets.Seasons.get()).data
                    .data;

                if (!seasons) return;

                const episodes = seasons.filter(
                    (season: any) => !season.parentUuid
                );

                let acts = seasons
                    .filter((season: any) => season.parentUuid)
                    .reverse()
                    .map((act) => {
                        const episode = episodes.find(
                            (ep) => ep.uuid === act.parentUuid
                        );

                        const epName = util.capFirstLetter(
                            episode?.displayName
                                .toString()
                                .toLowerCase() as string
                        );

                        const actName = util.capFirstLetter(
                            act.displayName.toString().toLowerCase()
                        );

                        return {
                            name: `${epName} - ${actName}`,
                            value: act.uuid
                        };
                    });

                if (focused.value.length > 0)
                    acts = acts.filter((act) =>
                        act.name.includes(focused.value)
                    );

                return interaction.respond(acts);
            }
        }
    }
}
