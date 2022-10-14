import { Argument, PieceContext } from "@sapphire/framework";
import { Seasons } from "@valapi/valorant-api.com";

export class ValorantActArgument extends Argument<Seasons.Seasons> {
    constructor(ctx: PieceContext) {
        super(ctx, {
            name: "val_act"
        });
    }

    public async run(parameter: string, context: Argument.Context) {
        const season = (
            await this.container.games.valorant.assets.Seasons.get()
        ).data.data?.find((act) =>
            act.displayName.toString().includes(parameter)
        );

        console.log(season);

        if (!season)
            return this.error({
                parameter,
                identifier: "act_not_found",
                message: "Valorant Act not found",
                context
            });

        return this.ok(season);
    }
}
