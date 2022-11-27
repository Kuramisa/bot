import Staff from "#schemas/Staff";
import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, TextInputStyle } from "discord.js";

export class BotStaffCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, {
            ...opts,
            name: "botstaff",
            description: "Add Staff in the bot",
            preconditions: ["OwnerOnly"]
        });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(0)
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("User to make them a staff")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("staff_type")
                        .setDescription("What type of staff are they gonna be?")
                        .setRequired(true)
                        .setChoices(
                            { name: "Owner", value: "owner" },
                            { name: "Helper", value: "helper" }
                        )
                )
        );
    }

    async chatInputRun(interaction: ChatInputCommandInteraction) {
        const { util } = this.container;

        const { options } = interaction;

        const user = options.getUser("user", true);
        const staffType = options.getString("staff_type", true);

        if (await Staff.findOne({ id: user.id }))
            return interaction.reply({
                content: `${user} is alrady a staff`,
                ephemeral: true
            });

        const modal = util
            .modal()
            .setCustomId("staff-modal")
            .setTitle("Creating a Staff for the bot")
            .setComponents(
                util
                    .modalRow()
                    .setComponents(
                        util
                            .input()
                            .setCustomId("staff-description")
                            .setLabel("Description")
                            .setPlaceholder("Description of the staff")
                            .setStyle(TextInputStyle.Paragraph)
                    )
            );

        await interaction.showModal(modal);

        const mInteraction = await interaction.awaitModalSubmit({ time: 0 });

        const description =
            mInteraction.fields.getTextInputValue("staff-description");

        await Staff.create({
            id: user.id,
            description,
            type: staffType
        });

        const embed = util
            .embed()
            .setTitle(
                `Made ${user.username} into a/an ${util.capFirstLetter(
                    staffType
                )}`
            )
            .setDescription(`**Their description**\n${description}`);

        await mInteraction.reply({ embeds: [embed], ephemeral: true });

        const msgEmbed = util
            .embed()
            .setTitle(
                `Congratulations you were made into a/an ${util.capFirstLetter(
                    staffType
                )} by ${interaction.user.username}`
            )
            .setDescription(`**Your description**\n${description}`);

        await user.send({ embeds: [msgEmbed] });
    }
}
