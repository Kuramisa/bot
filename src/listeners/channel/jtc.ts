import { Listener } from "@sapphire/framework";
import { VoiceState } from "discord.js";

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

        switch (gameName.toLowerCase()) {
            case "valorant": {
                const embed = util
                    .embed()
                    .setTitle(`${gameName} - Join to Create`)
                    .setDescription("⬇ Choose from below ⬇");

                const buttons = [
                    util
                        .button()
                        .setCustomId("unrated_jtc")
                        .setLabel("Unrated")
                        .setStyle("PRIMARY"),
                    util
                        .button()
                        .setCustomId("competitive_jtc")
                        .setLabel("Competitive")
                        .setStyle("DANGER"),
                    util
                        .button()
                        .setCustomId("custom_jtc")
                        .setLabel("Custom Game")
                        .setStyle("SECONDARY")
                ];

                const row = util.row().setComponents(buttons);

                try {
                    const message = await channel.send({
                        embeds: [embed],
                        components: [row]
                    });

                    const buttonClick = await message.awaitMessageComponent({
                        componentType: "BUTTON",
                        filter: (i) =>
                            buttons.some(
                                (button) => button.customId === i.customId
                            )
                    });

                    await message.edit({
                        components: [
                            row.setComponents(
                                buttons.map((button) =>
                                    button.setDisabled(true)
                                )
                            )
                        ]
                    });

                    if (!channel.members.get(member.id))
                        return buttonClick.reply({
                            content: "You have left the channel",
                            ephemeral: true
                        });

                    await buttonClick.deferUpdate();

                    switch (buttonClick.customId) {
                        case "unrated_jtc": {
                            const unratedChannels =
                                channel.parent.children.filter((channel) =>
                                    channel.name.includes("Unrated #")
                                );

                            const unratedChannel =
                                await channel.parent.createChannel(
                                    `Unrated #${unratedChannels.size + 1}`,
                                    {
                                        type: "GUILD_VOICE",
                                        userLimit: 5,
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

                            await member.voice.setChannel(unratedChannel);
                            break;
                        }
                        case "competitive_jtc": {
                            const competitiveChannels =
                                channel.parent.children.filter((channel) =>
                                    channel.name.includes("Competitive #")
                                );

                            const competitiveChannel =
                                await channel.parent.createChannel(
                                    `Competitive #${
                                        competitiveChannels.size + 1
                                    }`,
                                    {
                                        type: "GUILD_VOICE",
                                        userLimit: 5,
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

                            await member.voice.setChannel(competitiveChannel);
                            break;
                        }
                        case "custom_jtc": {
                            const customChannels =
                                channel.parent.children.filter((channel) =>
                                    channel.name.includes("Custom #")
                                );

                            const customChannel =
                                await channel.parent.createChannel(
                                    `Custom #${customChannels.size + 1}`,
                                    {
                                        type: "GUILD_VOICE",
                                        userLimit: 5,
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

                            await member.voice.setChannel(customChannel);
                            break;
                        }
                    }

                    await message.delete().catch(console.error);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
}
