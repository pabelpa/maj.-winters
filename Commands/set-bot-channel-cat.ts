import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import checkPermissions from '../Utils/checkPermissions';
const setBotChannelCat = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false


    const q = interaction.options.getChannel('channel-category');

    if (!q){
        interaction.editReply({content: "*Error: Invalid channel selected*"});

        return false;
    }

    await getCollections().config.updateOne({},{
        $set:{botCategoryId: q.id},
    });

    interaction.editReply({content: "*Updated bot channel category to <# " + (q.id)  +">*"});

    return true;
}

export default setBotChannelCat