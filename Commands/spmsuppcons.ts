import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spmsuppcons = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let facility = interaction.options.getString("name")! // Tell typescript to shut up and it is non-null
    let msupp = interaction.options.getInteger("msupp")! // Tell typescript to shut up and it is non-null

    if (!facility || !msupp) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

    const cleanedName = facility.replace(/\./g, "").replace(/\$/g, "")
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")

    const stockpileExist = await collections.facilities.findOne({ name: searchQuery })
    if (!stockpileExist) await interaction.editReply({ content: "The facility with the name `" + facility + "` does not exist." })
    else {
        await collections.facilities.updateOne({ name: cleanedName }, { $set: { msupp:msupp,timeLeft:""} })
        await interaction.editReply({ content: "Updated msupp consuption for `" + facility + "` facility to  `" + `${msupp}` + "` successfully. Now, specify how many msupps are left with `/spsetmsupp`." })


    }




    return true;
}

export default spmsuppcons