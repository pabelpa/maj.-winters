import { Client, ChatInputCommandInteraction, GuildMember, ForumChannel } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spremovestockpile = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!stockpile) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    const collections = getCollections()
    const cleanedName = stockpile.replace(/\./g, "").replace(/\$/g, "").toLowerCase()
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")

    const configDoc = (await collections.config.findOne({}))!

    const stockpiles = await collections.stockpiles.find({}).toArray()
    if ("stockpileChannelId" in configDoc) {
        const oldChannel = client.channels.cache.get(configDoc.stockpileChannelId) as ForumChannel

        let stockpileObj = await collections.stockpiles.findOne({ name: searchQuery })
        if (stockpileObj){
            try {
                let threadId = stockpileObj.thread
                let thread = await oldChannel.threads.fetch(threadId)
                if (thread){
                    await thread?.delete()
                }
            }
            catch (e) {
                console.log("Failed to delete thread for stockpile "+stockpileObj.name)
            }
            
        }
    }
    if ((await collections.stockpiles.deleteOne({ name: searchQuery })).deletedCount > 0) {
        const configObj = (await collections.config.findOne({}))!

        let stockpileTimes: any = NodeCacheObj.get("stockpileTimes")

        for (const name in stockpileTimes) {
            if (name.toLowerCase() === cleanedName) {
                delete stockpileTimes[stockpile]
                break
            }
        }
        
    
        await interaction.editReply({
            content: "Successfully deleted the stockpile " + stockpile
        });
    }
    else {
        await interaction.editReply({
            content: stockpile + " stockpile does not exist."
        });
    }



    return true;
}

export default spremovestockpile
