import { Command } from "@sapphire/framework";

export class PatCommand extends Command {
    constructor(ctx: Command.Context, opts: Command.Options) {
        super(ctx, { ...opts, name: "pat", description: "Pat someone" });
    }

    override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("The user to pat")
                        .setRequired(true)
                )
        );
    }

    async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const { util } = this.container;
        const { options } = interaction;

        const user = options.getUser("user", true);

        const { url } = await util.nekos.pat();

        const embed = util
            .embed()
            .setTitle(`${interaction.user.username} patted ${user.username}`)
            .setImage(url);

        return interaction.reply({ embeds: [embed] });
    }
}
