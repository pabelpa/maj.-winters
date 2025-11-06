import { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";
import { getCollections } from "../mongoDB";

const facClose = async (interaction: ChatInputCommandInteraction) => {
    const collections = getCollections();
    
    // Get the current FAC thread
    if (!interaction.channel?.isThread()) {
        await interaction.editReply({
            content: "This command can only be used in a FAC thread!"
        });
        return;
    }

    const threadId = interaction.channel.id;
    const fac = await collections.facs.findOne({ 
        guildId: interaction.guildId || '',
        threadId: threadId
    });

    if (!fac) {
        await interaction.editReply({
            content: "This thread is not a valid FAC thread!"
        });
        return;
    }

    try {
        // Archive and lock the thread
        await interaction.channel.setLocked(true);
        await interaction.channel.setArchived(true);

        // Delete FAC from database
        await collections.facs.deleteOne({
            guildId: interaction.guildId || '',
            threadId: threadId
        });

        await interaction.editReply({
            content: "FAC closed successfully!"
        });

    } catch (error) {
        console.error('Error closing FAC:', error);
        await interaction.editReply({
            content: "An error occurred while closing the FAC!"
        });
    }
};

export default facClose;