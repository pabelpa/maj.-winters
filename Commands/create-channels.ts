import { ChannelType,PermissionFlagsBits } from "discord.js"

import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import checkPermissions from "../Utils/checkPermissions";

const createForumChannel = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    let config = await getCollections().config.findOne({})
    let new_name = interaction.options.getString("channel-name",true)
    let chnl = await interaction.guild?.channels.create({
        name: new_name,
        type: ChannelType.GuildForum,
        parent:config?.botCategoryId,
    })
    if (chnl){
        interaction.editReply({content: "*Created channel <# " + (chnl.id)  +">*"});
    }else{
        interaction.editReply({content: "failed to create channel"});
    }
    return true
}

export default createForumChannel