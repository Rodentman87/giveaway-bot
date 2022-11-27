import {
	CommandInteraction,
	CommandInteractionOption,
	Guild,
	GuildChannel,
	GuildScheduledEventEntityType,
	GuildScheduledEventPrivacyLevel,
	PermissionFlagsBits,
} from "discord.js";
import { SlashCommand, ValidationError } from "slashasaurus";
import { ChannelType } from "discord-api-types/v10";

export default new SlashCommand(
	{
		name: "create-giveaway",
		description: "Creates a new giveaway",
		defaultMemberPermissions: PermissionFlagsBits.ManageEvents,
		options: [
			{
				type: "STRING",
				name: "name",
				description: "The name of the giveaway",
				minLength: 3,
				maxLength: 100,
				required: true,
			},
			{
				type: "STRING",
				name: "description",
				description: "The description of the giveaway",
				required: true,
			},
			{
				type: "INTEGER",
				name: "winners",
				description: "The number of winners",
				minValue: 1,
				maxValue: 50,
				required: true,
			},
			{
				type: "INTEGER",
				name: "duration",
				description: "The duration of the giveaway in hours",
				minValue: 1,
				maxValue: 400,
				required: true,
			},
			{
				type: "CHANNEL",
				name: "channel",
				description: "The channel to announce the winners in",
				channelTypes: [ChannelType.GuildText, ChannelType.GuildNews],
				required: true,
				validator: (
					interaction: CommandInteraction,
					value: NonNullable<CommandInteractionOption["channel"]>
				) => {
					const guild = interaction.guild!;
					const channel = guild.channels.cache.get(value.id) as GuildChannel;
					if (!channel) {
						throw new ValidationError(`Could not find channel <#${value.id}>`);
					}
					const hasPerms = channel
						.permissionsFor(guild.members.me!)
						.has([
							PermissionFlagsBits.SendMessages,
							PermissionFlagsBits.ViewChannel,
						]);
					if (!hasPerms) {
						throw new ValidationError(
							`I don't have permission to send messages in <#${value.id}>`
						);
					}
					return true;
				},
			},
			{
				type: "ATTACHMENT",
				name: "image",
				description: "The image of the giveaway",
			},
		] as const,
	},
	{
		run: async (interaction, client, options) => {
			if (!interaction.inGuild()) {
				interaction.reply({
					content: `This command can only be used in a server`,
					ephemeral: true,
				});
				return;
			}
			await interaction.deferReply({ ephemeral: true });
			let guild: Guild | undefined;
			if (interaction.inRawGuild()) {
				// Get the guild from the raw guild
				guild = await client.guilds.fetch(interaction.guildId);
			} else if (interaction.inCachedGuild()) {
				// Get the guild from the interaction
				guild = interaction.guild;
			}
			if (!guild) {
				interaction.reply({
					content: `Could not find the guild`,
					ephemeral: true,
				});
				return;
			}
			const now = Date.now();
			await guild.scheduledEvents.create({
				name: options.name,
				description:
					options.description +
					`

---
Winners will be announced in <#${options.channel.id}>
Click "Interested" to enter - Created by ${interaction.user.tag}`,
				privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
				entityType: GuildScheduledEventEntityType.External,
				entityMetadata: {
					location:
						options.winners > 1 ? `${options.winners} winners` : "1 winner",
				},
				scheduledStartTime: now + options.duration * 60 * 60 * 1000,
				scheduledEndTime: now + (options.duration + 1) * 60 * 60 * 1000,
				image: options.image ? options.image.url : undefined,
			});
			interaction.editReply({
				content: `Created giveaway`,
			});
		},
	}
);
