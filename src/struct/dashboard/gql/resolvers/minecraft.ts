import { Container } from "@sapphire/pieces";
import Minecraft from "@schemas/Minecraft";
import { UserInputError } from "apollo-server-core";

export default {
    Query: {
        chatLog: async (
            _: any,
            {
                username,
                message,
                ip
            }: { username: string; message: string; ip: string },
            { container: { client, minecraft, util } }: { container: Container }
        ) => {
            const db = await Minecraft.findOne({ ip });
            if (!db)
                throw new UserInputError("This minecraft server is not linked");

            if (!db.logs.chat) return;

            if (!db.logs.channel && db.logs.channel.length < 1)
                throw new UserInputError("Minecraft Logs channel is not setup");

            const guild = client.guilds.cache.get(db.guildId);
            if (!guild) throw new Error("Guild not found");

            const channel = guild.channels.cache.get(db.logs.channel);
            if (!channel) throw new Error("Channel not found");
            if (!channel.isText())
                throw new Error("Log channel is not text based");

            await channel.send(`${username} » ${message}`);
        }
    },
    Mutation: {
        linkServer: async (
            _: any,
            { code, ip }: { code: string; ip: string },
            { container: { client } }: { container: Container }
        ) => {
            const db = await Minecraft.findOne({ code });
            if (!db) throw new UserInputError("Invalid Code");

            const guild = client.guilds.cache.get(db.guildId);
            if (!guild) throw new UserInputError("Guild not found");

            if (db.ip && db.ip.length > 0)
                throw new Error(
                    `This Minecraft server is already linked to ${guild.name}`
                );

            db.ip = ip;

            await db.save();

            return "Discord Server Linked Successfully";
        },
        checkPlayer: async (
            _: any,
            { username }: { username: string },
            { container: { database } }: { container: Container }
        ) => {
            const db = (await database.users.getAll()).find(
                (user) => user.minecraft.username === username
            );

            if (!db) return false;
            return true;
        },
        linkPlayer: async (
            _: any,
            { username, code }: { username: string; code: string },
            {
                container: { client, database, minecraft, util }
            }: { container: Container }
        ) => {
            const db = (await database.users.getAll()).find(
                (user) => user.minecraft.code === code
            );

            if (!db) throw new UserInputError("Invalid Code");

            const user = client.users.cache.get(db.id);
            if (!user) throw new UserInputError("User not found");

            if (db.minecraft.username && db.minecraft.username.length > 0)
                throw new Error(`This Minecraft already linked to ${user.tag}`);

            const embed = util
                .embed()
                .setTitle("Confirmation of Linking Minecraft to Discord")
                .setDescription(
                    `Linking Minecraft Account: \`${username}\` to your Discord`
                )
                .setThumbnail(await minecraft.getAvatar(username));

            const row = util
                .row()
                .setComponents(
                    util
                        .button()
                        .setCustomId("accept_linking")
                        .setLabel("Accept")
                        .setStyle("SUCCESS"),
                    util
                        .button()
                        .setCustomId("decline_linking")
                        .setLabel("Decline")
                        .setStyle("DANGER")
                );

            const message = await user.send({
                embeds: [embed],
                components: [row]
            });

            const buttonPressed = await message.awaitMessageComponent({
                componentType: "BUTTON",
                filter: (i) => i.user.id === user.id
            });

            switch (buttonPressed.customId) {
                case "accept_linking": {
                    db.minecraft.username = username;
                    await db.save();

                    embed.setDescription(
                        `Linked Minecraft Account: \`${username}\` to your Discord`
                    );

                    message.edit({ embeds: [embed], components: [] });
                    return "Account Linked Successfully";
                }
                case "decline_linking": {
                    embed.setDescription("Declined the Link");

                    message.edit({
                        embeds: [embed],
                        components: []
                    });

                    return "Linking Declined";
                }
            }
        },
        unlinkPlayer: async (
            _: any,
            { username }: { username: string },
            {
                container: { client, database, minecraft, util }
            }: { container: Container }
        ) => {
            const db = (await database.users.getAll()).find(
                (user) => user.minecraft.username === username
            );

            if (!db)
                throw new UserInputError(
                    "You do not have any Discord account linked to your Minecraft account"
                );

            const user = client.users.cache.get(db.id);
            if (!user) throw new UserInputError("User not found");

            const dbUsername = db.minecraft.username;

            if (!dbUsername && dbUsername && dbUsername.length < 1)
                throw new Error(
                    "You do not have any Discord account linked to your Minecraft account"
                );

            const embed = util
                .embed()
                .setTitle("Confirmation of Unlinking Minecraft from Discord")
                .setDescription(
                    `Unlinking Minecraft Account: \`${username}\` from your Discord`
                )
                .setThumbnail(await minecraft.getAvatar(username));

            const row = util
                .row()
                .setComponents(
                    util
                        .button()
                        .setCustomId("accept_unlinking")
                        .setLabel("Accept")
                        .setStyle("SUCCESS"),
                    util
                        .button()
                        .setCustomId("decline_unlinking")
                        .setLabel("Decline")
                        .setStyle("DANGER")
                );

            const message = await user.send({
                embeds: [embed],
                components: [row]
            });

            const buttonPressed = await message.awaitMessageComponent({
                componentType: "BUTTON",
                filter: (i) => i.user.id === user.id
            });

            switch (buttonPressed.customId) {
                case "accept_unlinking": {
                    db.minecraft = { code: null, username: null };
                    await db.save();

                    embed.setDescription(
                        `Unlinked Minecraft Account: \`${username}\` from your Discord`
                    );

                    message.edit({ embeds: [embed], components: [] });
                    return "Account Unlinked Successfully";
                }
                case "decline_unlinking": {
                    embed.setDescription("Declined the Unlink");

                    message.edit({
                        embeds: [embed],
                        components: []
                    });

                    return "Unlinking Declined";
                }
            }
        },
        music: async (
            _: any,
            {
                username,
                action,
                query
            }: { username: string; action: string; query: string },
            {
                container: { client, database, music, util }
            }: { container: Container }
        ) => {
            const db = (await database.users.getAll()).find(
                (user) => user.minecraft.username === username
            );

            if (!db)
                throw new Error(
                    "Your Minecraft account is not linked with your Discord account"
                );

            const guildsCache = client.guilds.cache;
            const memberInstances = guildsCache
                .map((guild) => guild.members.cache.get(db.id))
                .filter((el) => el !== undefined);

            const member = memberInstances.find(
                (member) => member?.voice.channel
            );

            if (!member)
                throw new Error(
                    "You have to be in a voice channel to use Music commands"
                );

            const memberVoice = member.voice;

            if (!memberVoice.channel)
                throw new Error(
                    "You have to be in a voice channel to use Music commands"
                );

            const guild = member.guild;

            if (
                guild.me &&
                guild.me.voice.channel &&
                !memberVoice.channel.equals(guild.me.voice.channel)
            )
                throw new Error(
                    "I am already in one of the channels, you have to be in there to use Music commands"
                );

            if (memberVoice.deaf)
                throw new Error("You cannot use music command when deafened");

            let queue = music.getQueue(guild);

            let message = "Something went wrong, please try again";

            switch (action) {
                case "play": {
                    const result = await music.search(query, {
                        requestedBy: member.user
                    });

                    if (result.tracks.length < 1 || !result.tracks[0])
                        throw new Error(`Track ${query} not found`);

                    if (!queue) {
                        queue = music.createQueue(guild, {
                            metadata: memberVoice.channel
                        });

                        try {
                            if (!queue.connection)
                                await queue.connect(memberVoice.channel);
                        } catch {
                            queue.destroy();
                            throw new Error(
                                "Could not join your voice channel"
                            );
                        }
                    }

                    if (result.playlist) {
                        const playlist = result.playlist;
                        queue.addTracks(playlist.tracks);

                        const embed = util
                            .embed()
                            .setAuthor({
                                name: playlist.author.name,
                                url: playlist.author.url
                            })
                            .setTitle(
                                `Queued a playlist - ${util.capFirstLetter(
                                    playlist.source
                                )}`
                            )
                            .setThumbnail(playlist.thumbnail)
                            .setDescription(
                                `Title: ${playlist.title}${
                                    playlist.description
                                        ? `Description: ${playlist.description}`
                                        : ""
                                }`
                            )
                            .setURL(playlist.url);

                        await member.user.send({
                            embeds: [embed]
                        });
                    } else {
                        const track = result.tracks[0];

                        queue.addTrack(track);

                        const embed = util
                            .embed()
                            .setTitle("Queued Track")
                            .setDescription(
                                `${track.author} - ${track.title} | ${track.duration}`
                            )
                            .setThumbnail(track.thumbnail);

                        await member.user.send({
                            embeds: [embed],
                            components: []
                        });
                    }

                    if (!queue.playing) queue.play();

                    message = "Request Received";
                    break;
                }
                case "add": {
                    const result = await music.search(query, {
                        requestedBy: member.user
                    });

                    if (result.tracks.length < 1)
                        return `Tracks with ${query} was not found`;

                    if (!queue) {
                        queue = music.createQueue(guild, {
                            metadata: memberVoice.channel
                        });

                        try {
                            if (!queue.connection)
                                await queue.connect(memberVoice.channel);
                        } catch {
                            queue.destroy();
                            throw new Error(
                                "Could not join your voice channel"
                            );
                        }
                    }

                    if (result.playlist) {
                        const playlist = result.playlist;
                        queue.addTracks(playlist.tracks);

                        const embed = util
                            .embed()
                            .setAuthor({
                                name: playlist.author.name,
                                url: playlist.author.url
                            })
                            .setTitle(
                                `Queued a playlist - ${util.capFirstLetter(
                                    playlist.source
                                )}`
                            )
                            .setThumbnail(playlist.thumbnail)
                            .setDescription(
                                `Title: ${playlist.title}${
                                    playlist.description
                                        ? `Description: ${playlist.description}`
                                        : ""
                                }`
                            )
                            .setURL(playlist.url);

                        await member.user.send({
                            embeds: [embed]
                        });
                    } else {
                        const { message, chosenTracks } =
                            await music.selectTrackDM(
                                member.user,
                                result.tracks
                            );
                        queue.addTracks(chosenTracks);

                        const embed = util.embed().setTitle("Queued Tracks")
                            .setDescription(`
                        ${chosenTracks
                            .map(
                                (track, index) =>
                                    `\`${index + 1}\`. ${track.author} - ${
                                        track.title
                                    } | ${track.duration}`
                            )
                            .join(",\n")}
                        `);

                        await message.edit({
                            embeds: [embed],
                            components: []
                        });
                    }

                    if (!queue.playing) queue.play();
                    message = "Request Received";
                    break;
                }
                case "stop": {
                    if (!queue) throw new Error("Music is not playing");

                    queue.stop();

                    message = "Stopped the Player";
                    break;
                }
                case "skip": {
                    if (!queue) throw new Error("Music is not playing");

                    if (queue.tracks.length)
                        return "There are no upcoming tracks to skip to";

                    const currentTrack = queue.nowPlaying();
                    if (currentTrack.requestedBy.id !== member.id)
                        throw new Error(
                            `You didn't request this track, ask ${currentTrack.requestedBy.tag} to skip the track, because they requested it`
                        );

                    queue.skip();

                    message = "Skipped the current track";
                    break;
                }
            }

            return message;
        }
    }
};
