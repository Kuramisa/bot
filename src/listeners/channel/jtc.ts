import { Listener } from "@sapphire/framework";
import {
    ButtonBuilder,
    ButtonStyle,
    VoiceState,
    Collection,
    ChannelType,
    ComponentType
} from "discord.js";

export class JTCListener extends Listener {
    constructor(ctx: Listener.Context, opts: Listener.Options) {
        super(ctx, {
            ...opts,
            name: "Join to create channel listener",
            event: "voiceStateUpdate"
        });
    }

    async run(_: any, state: VoiceState) {
        if (!state.channel) return;
        const { database, util } = this.container;
        const { guild, member, channel } = state;
        if (!member) return;
        if (
            !channel ||
            !channel.parent ||
            channel.type !== ChannelType.GuildVoice
        )
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

        const colors: ButtonStyle[] = [
            ButtonStyle.Primary,
            ButtonStyle.Danger,
            ButtonStyle.Secondary
        ];

        try {
            const buttons: Collection<number, ButtonBuilder> = new Collection();

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
                componentType: ComponentType.Button,
                filter: (i) =>
                    buttons.some(
                        (button) =>
                            (button.toJSON() as any).customId === i.customId
                    )
            });

            await message.edit({
                components: message.components.map((row: any) =>
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
                (button: any) => buttonClick.customId === button.customId
            ) as any;
            if (!button) return;

            const channels = channel.parent.children.cache.filter((channel) =>
                channel.name.includes(button.label as string)
            );

            const newChannel = await channel.parent.children.create({
                name: `${button.label} #${channels.size + 1}`,
                type: ChannelType.GuildVoice,
                permissionOverwrites: [
                    {
                        id: member.id,
                        allow: [
                            "MuteMembers",
                            "MoveMembers",
                            "CreateInstantInvite"
                        ]
                    }
                ]
            });

            await member.voice.setChannel(newChannel);

            await message.delete();
        } catch (err) {
            console.error(err);
        }
    }
}
