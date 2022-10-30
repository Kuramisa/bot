import { Listener } from "@sapphire/framework";
import {
    MessageButton,
    MessageButtonStyleResolvable,
    VoiceState,
    Collection
} from "discord.js";

export class JTCListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Join to create channel listener",
            event: "voiceStateUpdate"
        });
    }

    public async run(_: any, state: VoiceState) {
        if (!state.channel) return;
        const { database, util } = this.container;
        const { guild, member, channel } = state;
        if (!member) return;
        if (!channel || !channel.parent || channel.type !== "GUILD_VOICE")
            return;

        const db = await database.guilds.get(guild);
        if (!db) return;
        if (!db.games || !db.games.settings) return;

        const gameName = channel.parent.name;
        if (!Object.keys(db.games.settings).includes(gameName.toLowerCase()))
            return;

        const gameSettings = db.games.settings[gameName.toLowerCase()];
        if (
            !gameSettings.category ||
            !gameSettings.jtc.enabled ||
            !gameSettings.jtc.channel
        )
            return;

        if (gameSettings.jtc.channel !== channel.id) return;

        const embed = util
            .embed()
            .setTitle(`${gameName} - Join to Create`)
            .setDescription("⬇ Choose from below ⬇");

        const colors: MessageButtonStyleResolvable[] = [
            "PRIMARY",
            "DANGER",
            "SECONDARY"
        ];

        try {
            const buttons: Collection<number, MessageButton> = new Collection();

            gameSettings.types.forEach((type, i) =>
                buttons.set(
                    i,
                    util
                        .button()
                        .setCustomId(`${type}_jtc`)
                        .setLabel(util.capFirstLetter(type))
                        .setStyle(
                            colors[Math.floor(Math.random() * colors.length)]
                        )
                )
            );

            const message = await channel.send({
                content: `${member}`,
                embeds: [embed],
                components: [util.row().setComponents(buttons.first(5))]
            });

            const buttonClick = await message.awaitMessageComponent({
                componentType: "BUTTON",
                filter: (i) =>
                    buttons.some((button) => button.customId === i.customId)
            });

            await message.edit({
                components: message.components.map((row) =>
                    row.setComponents(
                        buttons.map((button) => button.setDisabled(true))
                    )
                )
            });

            if (!channel.members.get(member.id))
                return buttonClick.reply({
                    content: "You have left the channel",
                    ephemeral: true
                });

            await buttonClick.deferUpdate();

            const button = buttons.find(
                (button) => buttonClick.customId === button.customId
            );
            if (!button) return;

            const channels = channel.parent.children.filter((channel) =>
                channel.name.includes(button.label as string)
            );

            const newChannel = await channel.parent.createChannel(
                `${button.label} #${channels.size + 1}`,
                {
                    type: "GUILD_VOICE",
                    permissionOverwrites: [
                        {
                            id: member.id,
                            allow: [
                                "MUTE_MEMBERS",
                                "MOVE_MEMBERS",
                                "CREATE_INSTANT_INVITE"
                            ]
                        }
                    ]
                }
            );

            await member.voice.setChannel(newChannel);

            await message.delete();
        } catch (err) {
            console.error(err);
        }
    }
}
