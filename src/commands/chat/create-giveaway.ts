import { Guild } from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";
import { SlashCommand } from "slashasaurus";

export default new SlashCommand(
	{
		name: "create-giveaway",
		description: "Creates a new giveaway",
		options: [
			{
				type: "STRING",
				name: "name",
				description: "The name of the giveaway",
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
				channelTypes: [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_NEWS],
				required: true,
			},
			{
				type: "ATTACHMENT",
				name: "image",
				description: "The image of the giveaway",
			},
			{
				type: "BOOLEAN",
				name: "anonymous",
				description: "Whether the giveaway creator should be listed",
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
			if (!guild.me?.permissionsIn(options.channel.id).has("SEND_MESSAGES")) {
				interaction.reply({
					content: `I don't have permission to send messages in that channel`,
					ephemeral: true,
				});
				return;
			}
			const now = Date.now();
			guild.scheduledEvents.create({
				name: options.name,
				description:
					options.description +
					`

---
Winners will be announced in <#${options.channel.id}>
Click "Interested" to enter` +
					(options.anonymous ? "" : ` - Created by ${interaction.user.tag}`),
				privacyLevel: "GUILD_ONLY",
				entityType: "EXTERNAL",
				entityMetadata: {
					location:
						options.winners > 1 ? `${options.winners} winners` : "1 winner",
				},
				scheduledStartTime: now + options.duration * 60 * 60 * 1000,
				scheduledEndTime: now + (options.duration + 1) * 60 * 60 * 1000,
				image: options.image ? options.image.url : undefined,
			});
			interaction.reply({
				content: `Created giveaway`,
				ephemeral: true,
			});
		},
	}
);
