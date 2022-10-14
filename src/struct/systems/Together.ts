import { Container } from "@sapphire/pieces";
import { TogetherApplications } from "@types";
import { VoiceBasedChannel, VoiceChannel } from "discord.js";
/**
 * Inspired by Discord Together package by RemyK888
 */
export default class Together {
    private readonly container: Container;

    readonly applications: TogetherApplications;

    constructor(container: Container) {
        this.container = container;

        this.applications = {
            youtube: "880218394199220334",
            youtube_dev: "880218832743055411",
            poker: "755827207812677713",
            betrayal: "773336526917861400",
            fishing: "814288819477020702",
            chess: "832012774040141894",
            chess_dev: "832012586023256104",
            lettertile: "879863686565621790",
            wordsnack: "879863976006127627",
            doodlecrew: "878067389634314250",
            awkword: "879863881349087252",
            spellcast: "852509694341283871",
            checkers: "832013003968348200",
            puttparty: "763133495793942528",
            sketchheads: "902271654783242291",
            ocho: "832025144389533716",
            puttpartyqa: "945748195256979606",
            sketchyartist: "879864070101172255",
            land: "903769130790969345",
            meme: "950505761862189096",
            askaway: "976052223358406656",
            bobble: "947957217959759964"
        };
    }

    async createCode(
        channel: VoiceBasedChannel | VoiceChannel,
        option: keyof TogetherApplications
    ) {
        const { guild } = channel;

        const appID =
            this.applications[option as keyof typeof this.applications];

        const invite = await guild.invites.create(channel, {
            maxAge: 86400,
            maxUses: 0,
            targetApplication: appID,
            targetType: 2,
            temporary: false
        });

        return invite.url;
    }
}
