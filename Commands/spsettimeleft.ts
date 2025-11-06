import { Client, ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";
import checkTimeNotifs from "../Utils/checkTimeNotifs";

const spsettimeleft = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")! // Tell typescript to shut up and it is non-null
    let expireDate = interaction.options.getInteger("time")!

    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false

    if (!stockpile || !expireDate) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    
    const collections = getCollections()

    const timeCheckDisabled: any = NodeCacheObj.get("disableTimeNotif")

    const cleanName = stockpile.replace(/\./g, "").replace(/\$/g, "")
    const searchQuery = new RegExp(cleanName, "i")
    const stockpileExist = await collections.stockpiles.findOne({ name: searchQuery })

    if (stockpileExist) {
        let updateObj: any = {
            expireDate: new Date(expireDate * 1000)
        }
        mongoSanitize.sanitize(updateObj, { replaceWith: "_" })
        await collections.stockpiles.updateOne({ name: searchQuery }, { $set: updateObj })
        await collections.stockpiles.updateOne({ name: searchQuery }, { $unset: {upperBound: 1} })
        await interaction.editReply({ content: `Updated the stockpile timer successfully. It is set to expire in: <t:${Math.floor(updateObj.expireDate.getTime() / 1000)}:R>` })

        const stockpileTimesObj: any = NodeCacheObj.get("stockpileTimes")

        const timerBP: any = NodeCacheObj.get("timerBP")
        let nextBreakPointIndex = 4

        for (let x = 0; x < timerBP.length; x++) {
            const expireDate: any = updateObj.expireDate
            const currentDate: any = new Date()
            if (((expireDate - currentDate) / 1000) <= timerBP[x]) {
                nextBreakPointIndex = x

                break
            }
        }
        stockpileTimesObj[stockpileExist.name] = { expireDate: updateObj.expireDate, nextBreakPointIndex: nextBreakPointIndex }

        let updatedStockpile = await collections.stockpiles.findOne({name:searchQuery})
        await updateStockpileMsg(client,"",updatedStockpile,true)
        
        checkTimeNotifs(client, true, false, interaction.guildId!)
    }
    else await interaction.editReply({ content: "Error, the stockpile `" + stockpile + "` does not exist." })

    return true;
}

export default spsettimeleft
