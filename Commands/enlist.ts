import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction, Role,GuildMemberRoleManager } from 'discord.js';
const enlist = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let collections = getCollections();
    let config = await collections.config.findOne({})
    if (!config){ return false}
    const activeRole = config.activeRole;
    const inactiveRole = config.inactiveRole;

    if (!activeRole) {
        interaction.editReply({content: '*Error: Active Role has not been configured*'});
        return false;
    }

    if (!inactiveRole) {
        interaction.editReply({content: '*Error: Inactive Role has not been configured*'});
        return false;
    }

    

    if ((interaction.member?.roles as GuildMemberRoleManager).cache.some((v:Role) => {return v.id == activeRole})){
        interaction.editReply({content: `*You've already enlisted! Get out there and fight*`});
        return false;
    }else{
        (interaction.member?.roles as GuildMemberRoleManager).add(activeRole);
        interaction.editReply({content: '*Successfully signed up for the war'});
        return true;
    }
}

export default enlist