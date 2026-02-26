import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction,GuildMember } from 'discord.js';
import checkPermissions from '../Utils/checkPermissions';
const setChannelGeneral = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {

    if (await checkPermissions(interaction, "admin", interaction.member as GuildMember)){
        const q = interaction.options.getChannel('channel');
        const channelString = interaction.options.getString('channel-string')!

        if (!q){
            interaction.editReply({content: "*Error: Invalid channel selected*"});

            return false;
        }

        let updateObj:any = {}
        updateObj[channelString]=q.id
        await getCollections().config.updateOne({},{
            $set:updateObj,
        });

        interaction.editReply({content: "*Updated logi ticket channel to <# " + (q.id)  +">*"});
    }else{
        interaction.editReply({content: '*Invalid permissions to run this command*'});
    }
    return true;
}

export default setChannelGeneral