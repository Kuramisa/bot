import { Listener } from "@sapphire/framework";
import { Message } from "discord.js";

export class GiveXPListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Give xp to members",
            event: "messageCreate",
        });
    }

    async run(message: Message<true>) {
        if (message.author.bot) return;

        const {
            systems: { xp },
        } = this.container;

        const { author, channel, guild } = message;

        const today = new Date();
        const ifWeekend = today.getDay() === 6 || today.getDay() === 0;

        const give = ifWeekend
            ? Math.floor(Math.random() * 75) * 2
            : Math.floor(Math.random() * 75);
        const rand = ifWeekend
            ? Math.round(Math.random() * 3)
            : Math.round(Math.random() * 4);

        if (rand === 0) {
            const currentLevel = await xp.getLevel(author);
            const currentXP = await xp.getXP(author);
            const requiredXP = xp.calculateReqXP(currentLevel as number);
            await xp.giveXP(author, give);

            if (!currentXP || !requiredXP) return;
            if (currentXP + give >= requiredXP) {
                await xp.levelUp(author);
                if (
                    !guild.members.me
                        ?.permissionsIn(channel)
                        .has("SendMessages")
                )
                    return;

                let content = `${author}, You have leveled up to **Level ${await xp.getLevel(
                    author
                )}**`;

                if (ifWeekend)
                    content = `${content} *It's a weekend so you get double xp :>*`;
                return channel
                    .send({ content, allowedMentions: { repliedUser: false } })
                    .then((msg) => setTimeout(() => msg.delete(), 2000));
            }
        }
    }
}
