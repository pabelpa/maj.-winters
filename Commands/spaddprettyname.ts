import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spaddprettyname = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null
    let prettyName = interaction.options.getString("pretty_name")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile || !prettyName) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    const collections = getCollections()

    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "")
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")

    const cleanedPrettyName = prettyName.replace(/\./g, "").replace(/\$/g, "")
    const stockpileObj = await collections.stockpiles.findOne({ name: searchQuery })

    if (!stockpileObj) {
        await interaction.editReply({ 
            content: "The stockpile with the name `" + stockpile + "` does not exist." 
        })
    } else {
        await collections.stockpiles.updateOne(
            {_id:stockpileObj._id},
            {$set:{prettyName:cleanedPrettyName}}
        )

        const stockpileTime: any = NodeCacheObj.get("stockpileTimes")
        if (stockpileTime[stockpileObj.name]){
            stockpileTime[stockpileObj.name].prettyName = cleanedPrettyName
            
        }else{
            stockpileTime[stockpileObj.name]={prettyName:cleanedPrettyName}

        }
        await interaction.editReply({ content: "Added the pretty name `" + cleanedPrettyName + "` to stockpile `" + stockpileObj.name + "` successfully." })

        let updatedStockpile = await collections.stockpiles.findOne({_id:stockpileObj._id})
        await updateStockpileMsg(client,"",updatedStockpile,true)
    }




    return true;
}

export default spaddprettyname
