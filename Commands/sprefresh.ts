import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import checkTimeNotifs from "../Utils/checkTimeNotifs";
import generateStockpileMsg from "../Utils/generateStockpileMsg";
import updateStockpileMsg from "../Utils/updateStockpileMsg";

const sprefresh = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const stockpile = interaction.options.getString("stockpile")!

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

    const collections = getCollections()

    if (stockpile) {
        const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
        if (disableTimeNotif) {
            await interaction.editReply({ content: "Error: The time-checking feature of Storeman Bot is disabled for this server. Please use `/spdisabletime` to enable it." })
            return false
        }

        const cleanName = stockpile.replace(/\./g, "_").replace(/\./g, "").replace(/\$/g, "")
        const searchQuery = new RegExp(cleanName, "i")

        const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })
        if (stockpileExist) {
            const expireDate = new Date((new Date()).getTime() + 60 * 60 * 1000 * 50)
            await collections.stockpiles.updateOne({ name: searchQuery }, { $set: { expireDate: expireDate }, $unset: { upperBound: 1 } })
            await interaction.editReply({ content: "Updated the stockpile " + cleanName + " count down timer successfully" })

            const stockpileTimes: any = NodeCacheObj.get("stockpileTimes")

            const timerBP: any = NodeCacheObj.get("timerBP")
            stockpileTimes[cleanName] = { expireDate: expireDate, nextBreakPointIndex: timerBP.length - 1 }

            let updatedStockpile = await collections.stockpiles.findOne({_id:stockpileExist._id})
            await updateStockpileMsg(interaction.client,interaction.guildId,updatedStockpile,true)

            checkTimeNotifs(interaction.client, true, false, interaction.guildId!)
        }
        else {
            await interaction.followUp({ content: "Error: Stockpile " + cleanName + " does not exist", ephemeral: true })
        }
    }
    else {
        await collections.stockpiles.find({}).forEach( (doc: any) => {
            const runUpdate = async (doc:any)=>{
                const expireDate = new Date((new Date()).getTime() + 60 * 60 * 1000 * 50)
    
                await collections.stockpiles.updateOne({ name: doc.name }, { $set: { expireDate: expireDate }, $unset: { upperBound: 1 } })
                const stockpileTimes: any = NodeCacheObj.get("stockpileTimes")
    
                const timerBP: any = NodeCacheObj.get("timerBP")
                stockpileTimes[doc.name] = { expireDate: expireDate, nextBreakPointIndex: timerBP.length - 1 }

                let updatedStockpile = await collections.stockpiles.findOne({_id:doc._id})
                await updateStockpileMsg(interaction.client,interaction.guildId,updatedStockpile,true)
            }
            runUpdate(doc)

        })

        checkTimeNotifs(interaction.client, true, false, interaction.guildId!)
        await interaction.editReply("Updated the timers of all your stockpiles.")
    }

    return true;
}

export default sprefresh
