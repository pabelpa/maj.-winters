import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction,Guild,GuildMember, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import checkPermissions from '../Utils/checkPermissions';
import {rank} from "./rank"
import { syncBuiltinESMExports } from 'module';

const roles:any = {
        "eng1":{symb:"|⚙️1️⃣",order:0},
        "eng2":{symb:"|⚙️2️⃣",order:2},
        "eng3":{symb:"|⚙️3️⃣",order:3},
        "eng4":{symb:"|⚙️4️⃣",order:4},
        "fac1":{symb:"|🏭1️⃣",order:0},
        "fac2":{symb:"|🏭2️⃣",order:1},
        "fac3":{symb:"|🏭3️⃣",order:2},
        "fac4":{symb:"|🏭4️⃣",order:3},
        "logi1":{symb:"|🚚1️⃣",order:0},
        "logi2":{symb:"|🚚2️⃣",order:1},
        "logi3":{symb:"|🚚3️⃣",order:2},
        "logi4":{symb:"|🚚4️⃣",order:3},
        "logi5":{symb:"|🚚🏭5️⃣",order:4},
        "arty2":{symb:"|🧨2️⃣",order:1},
        "arty3":{symb:"|🧨3️⃣",order:2},
        "armor2":{symb:"|🛡️2️⃣",order:1},
        "armor3":{symb:"|🛡️3️⃣",order:2},
        "comb1":{symb:"|🪖1️⃣",order:0},
        "comb2":{symb:"|🪖2️⃣",order:1},
        "comb3":{symb:"|🪖3️⃣",order:2},
        "comb4":{symb:"|🪖🧨🛡️4️⃣",order:3},
        "comb5":{symb:"|🪖🧨🛡️5️⃣",order:4},
}
const displayRank = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let collections = getCollections();
    let config = (await collections.config.findOne({}))!


    let members = getCollections().members
    let res:any = await members.findOne({memId:interaction.user.id})

    if (!res){
        await rank(interaction)
        res = await members.findOne({memId:interaction.user.id})
    }



    //in-game name
    const ign = interaction.options.getString("in-game-name");
    const show = interaction.options.getBoolean("show")
    if(!ign){
        interaction.editReply({content: '*Invalid in-game name, please try again*'});
        return false;
    }
    await members.updateOne(
        {_id:res._id},
        {$set:{ign:ign,showRank:show}}
    )

    let newName = ign
    if (show){
        
        let syms=new Array
        let order=new Array
        for(let role in roles){
            if((interaction.member as GuildMember).roles.cache.has(config.rankRoles[role])){
                syms.push(roles[role].symb)
                order.push(roles[role].order)
            }
        }
        let highestOrder = Math.max.apply(null,order)
        let roleSymb = ""
        for (let i=0;i<order.length;i++){
            if (order[i]==highestOrder){
                roleSymb = roleSymb+syms[i]
            }
        }

        newName = ign+"["+res.short+roleSymb+"]"
        
    }
    if(!interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.ManageNicknames)){
        interaction.editReply({content: '*bot does not have permissions to change nicknames*'});
        interaction.followUp({content:"here is your new nickname if you want to change it yourself: "+newName,ephemeral:true})
        return false;
    }
    if (interaction.guild?.members.me?.roles.highest.position<=(interaction.member as GuildMember).roles.highest.position){
        interaction.editReply({content: '*bot does not have permissions to change nicknames because its role is not higher than yours*'});
        interaction.followUp({content:"here is your new nickname if you want to change it yourself: "+newName,ephemeral:true})
        return false;

    }
    if (interaction.user.id==interaction.guild.ownerId){
        interaction.editReply({content: '*bot does not have permissions to change nicknames of server owner*'});
        interaction.followUp({content:"here is your new nickname if you want to change it yourself: "+newName,ephemeral:true})
        return false;

    }

    await (interaction.member as GuildMember).setNickname(newName)

    return true
}

export default displayRank
