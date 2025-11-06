import { ChatInputCommandInteraction, GuildMember, TextChannel, ChannelType, ForumChannel, ThreadAutoArchiveDuration } from 'discord.js';
import { getCollections } from '../mongoDB'
import checkPermissions from '../Utils/checkPermissions';

const setFacChannel = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    if (await checkPermissions(interaction, "admin", interaction.member as GuildMember)) {
        const channel = interaction.options.getChannel('channel');

        const channelType = (channel as any)?.type;
        if (!channel || (channelType !== ChannelType.GuildText && channelType !== ChannelType.GuildForum)) {
            interaction.editReply({ content: "*Error: Please select a valid text or forum channel*" });
            return false;
        }

        if (channelType === ChannelType.GuildForum) {
            const forum = channel as unknown as ForumChannel;

            await getCollections().config.updateOne({}, {
                $set: { facChannel: forum.id }
            });

            // Create a forum post (thread) as the FAC management message with the create button
            const facInfoThread = await forum.threads.create({
                name: 'Facility Management System',
                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                reason: 'FAC management message',
                message: {
                    content: "# Facility Management System\n\nWelcome to the facility management system. Follow these steps to create and manage a FAC:\n\n1) Click the button below: 'Create New FAC'\n2) Type a location name or code and confirm\n3) Fill in the FAC details (Custom name, MSUPP consumption, Exports, Imports, Production Procedures)\n4) A dedicated thread will be created with two action buttons to update stock/expiry or edit metadata later\n\nNotes:\n- The old /fac-create command is obsolete; please use the button flow above.\n- You can edit a FAC later using the buttons inside its thread.",
                    components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            style: 1,
                            label: "Create New FAC",
                            custom_id: "create_fac"
                        }]
                    }]
                }
            });
            await facInfoThread.pin();

            await getCollections().config.updateOne({}, {
                $set: { facMessageId: facInfoThread.id }
            });

            interaction.editReply({ content: `*Set FAC management forum to <#${forum.id}> (management post created)*` });
        } else {
            const textChannel = channel as TextChannel;

            await getCollections().config.updateOne({}, {
                $set: { facChannel: textChannel.id }
            });

            // Send initial FAC info message
            const facInfoMessage = await textChannel.send({
                content: "# Facility Management System\n\nWelcome to the facility management system. Follow these steps to create and manage a FAC:\n\n1) Click the button below: 'Create New FAC'\n2) Type a location name or code and confirm\n3) Fill in the FAC details (Custom name, MSUPP consumption, Exports, Imports, Production Procedures)\n4) A dedicated thread will be created with two action buttons to update stock/expiry or edit metadata later\n\nNotes:\n- The old /fac-create command is obsolete; please use the button flow above.\n- You can edit a FAC later using the buttons inside its thread.",
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        style: 1,
                        label: "Create New FAC",
                        custom_id: "create_fac"
                    }]
                }]
            });

            await getCollections().config.updateOne({}, {
                $set: { facMessageId: facInfoMessage.id }
            });

            interaction.editReply({ content: `*Set FAC management channel to <#${channel.id}>*` });
        }
        return true;
    }
    return false;
}

export default setFacChannel;