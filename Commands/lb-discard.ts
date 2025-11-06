
import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction } from 'discord.js';
const lbDiscard = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const t = await getCollections().tickets.findOne({
        author: interaction.user.username,
        complete: false
    })
    
    if (!t){
        interaction.editReply({content: "*No logistics request started, run **/create-logistics-ticket** to start builder*"})
        return false
    }
    
    const t_del = await getCollections().tickets.deleteOne({
        author: interaction.user.username,
        complete: false
    })
    interaction.editReply({content: "*Current builder discarded, start a new ticket by running the **/create-logistics-ticket** command*"})
    
    const rle = await interaction.guild?.roles.fetch(t.ticketRoleId);
    const q = interaction.client.channels.cache.get(t.channelId);
    if (rle){
        await rle.delete();
    }
    
    if (q){
        await q.delete()
    }
    return true
}

export default lbDiscard