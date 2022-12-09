import { Giveaway, GiveawayData, GiveawaysManager } from "discord-giveaways";
import giveawayModel from "#schemas/Giveaway";
import { Snowflake } from "discord.js";
import { Container } from "@sapphire/pieces";

export default class Giveaways extends GiveawaysManager {
    constructor(container: Container) {
        super(container.client, {
            default: {
                botsCanWin: false,
                embedColor: "#FF0000",
                reaction: "🎉",
            },
        });
    }

    getAllGiveaways = async () =>
        (await giveawayModel.find().lean().exec()) as Giveaway[];

    async saveGiveaway(messageId: Snowflake, data: GiveawayData) {
        await giveawayModel.create(data);

        return true;
    }

    async editGiveaway(messageId: Snowflake, data: GiveawayData) {
        await giveawayModel.updateOne({ messageId }, data).exec();

        return true;
    }

    async deleteGiveaway(messageId: Snowflake) {
        await giveawayModel.deleteOne({ messageId }).exec();

        return true;
    }
}
