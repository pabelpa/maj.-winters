import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction } from 'discord.js';
const setInactiveRole = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let collections = getCollections();
    let config = await collections.config.findOne()
    if (!config){
        interaction.editReply("config db not created")
        return false
    }
    if (interaction.memberPermissions?.has("ManageChannels")){
        const rl = interaction.options.getRole("role");
        
        if (!rl){
            interaction.editReply({content: '*Invalid role provided, please try again*'});
            return false;
        }

        await collections.config.updateOne({},{$set:{
            inactiveRole: rl.id}
        })

        interaction.editReply({content: '*Inactive Role Set*'});
    }else{
        interaction.editReply({content: '*Insufficient Permissions*'});
    }
    return true
}

export default setInactiveRole
