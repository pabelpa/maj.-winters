import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction,GuildMember } from 'discord.js';
import checkPermissions from '../Utils/checkPermissions';
const setRankRoles = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let collections = getCollections();
    let config = await collections.config.findOne({})
    if (!config){
        interaction.editReply("config db not created")
        return false
    }


    if (await checkPermissions(interaction, "admin", interaction.member as GuildMember)){
        const rl = interaction.options.getRole("role");
        const rank = interaction.options.getString("rank");

        let rankRoles:any = {}
        if (config.rankRoles){
            for(let rankCat in config.rankRoles){
                rankRoles[rankCat] = config.rankRoles[rankCat]
            }
        }


        if (!rl){
            interaction.editReply({content: '*Invalid role provided, please try again*'});
            return false;
        }
        if (!rank){
            interaction.editReply({content: 'invalid rank, please try again'});
            return false;
        }
        rankRoles[rank]=rl.id

        await collections.config.updateOne({},{$set:{
            rankRoles: rankRoles}
        })

        interaction.editReply({content: '*rank roles updated*'});
    }else{
        interaction.editReply({content: '*Insufficient Permissions*'});
    }
    return true
}

export default setRankRoles