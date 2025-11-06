import { Client, ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";

const spsetmsupp = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let name = interaction.options.getString("name")! // Tell typescript to shut up and it is non-null
    let msupp = interaction.options.getInteger("msupp")!
    let msuppInt = msupp
    console.log(msuppInt)
    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const cleanedName = name.replace(/\./g, "").replace(/\$/g, "")
    const fac = await collections.facilities.findOne({ name: cleanedName })
    if (fac){
        let newTimeLeft: any;
        const msuppObj: any = NodeCacheObj.get("msuppsLeft")
        const timerBP: any = NodeCacheObj.get("timerBP")
        const currentDate: any = new Date()
        newTimeLeft = new Date(currentDate.getTime() + 60 * 60 * 1000 * msuppInt/fac.msupp)

        let timeNotificationLeft
        for (let x = 0; x < timerBP.length; x++) {
            const timeLeftProperty: any = newTimeLeft
            const currentDate: any = new Date()
            if (((timeLeftProperty - currentDate) / 1000) <= timerBP[x]) {
                timeNotificationLeft = x
                break
            }
        }
        await collections.facilities.updateOne({ name: cleanedName }, { $set: { lastUpdated: currentDate, timeLeft: newTimeLeft,msupplevel:msuppInt} })
        await interaction.editReply({ content: "added `"+ `${msuppInt}`+"` msupps to facility with the name `" + name +"`"})
    } else {
        await interaction.editReply({ content: "The facility with the name `" + name + "` could not be found." })
    }
    return true


}

export default spsetmsupp