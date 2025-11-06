import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spremoveprettyname = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    const collections = getCollections()
    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "")
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")
    const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })
    if (!stockpileExist)  {
        await interaction.editReply({ content: "The stockpile with the name `" + stockpile + "` does not exist." })
    } else {
        if ('prettyName' in stockpileExist) {
            await collections.stockpiles.updateOne({_id:stockpileExist._id}, { $unset: { prettyName: 1 } })
            const times: any = NodeCacheObj.get("stockpileTimes")
            delete times[stockpileExist.name].prettyName

            await interaction.editReply({ content: "Removed the pretty name from `" + stockpileExist.name + "` successfully." })

            let updatedStockpile = await collections.stockpiles.findOne({name:searchQuery})
            await updateStockpileMsg(client, interaction.guildId,updatedStockpile,true)
        } else {
            await interaction.editReply("Error: there are no pretty names")
        }
    }
    
    return true;
}


export default spremoveprettyname
