import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spremoveloc = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "").toLowerCase()
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")
    const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })

    if (!stockpileExist) {
        await interaction.editReply({ content: "The stockpile with the name `" + stockpile + "` does not exist." })
    }
    else {
        
        await collections.stockpiles.updateOne({}, { $unset: { location: 1 } })
        await interaction.editReply({ content: "Removed the location from `" + stockpileExist.name + "` successfully." })
        let updatedStockpile = await collections.stockpiles.findOne({name:searchQuery})
        await updateStockpileMsg(client, interaction.guildId,updatedStockpile,true)
    }




    return true;
}

export default spremoveloc
