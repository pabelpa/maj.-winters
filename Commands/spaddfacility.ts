import { Client, ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";

const spaddfacility = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let name = interaction.options.getString("name")! // Tell typescript to shut up and it is non-null
    let msupp = interaction.options.getInteger("msupp")! // Tell typescript to shut up and it is non-null
    let msuppLevel = interaction.options.getInteger("msupplevel")! // Tell typescript to shut up and it is non-null
    console.log(name)
    console.log(msupp)
    console.log(msuppLevel)
    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if (!name || !msupp) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }
    let msuppInt = msupp
    let msuppLevelInt = msuppLevel

    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const cleanedName = name.replace(/\./g, "").replace(/\$/g, "")
    const stockpileExist = await collections.facilities.findOne({ name: cleanedName })
    if (stockpileExist) {
        await interaction.editReply({ content: "The facility with the name `" + name + "` already exists." })
    }
    else {
        let insertObj: any = {
            name: cleanedName, items: {}, lastUpdated: new Date(), msupp:msuppInt, msupplevel:msuppLevelInt
        }
        let newTimeLeft: any;
        const msuppObj: any = NodeCacheObj.get("msuppsLeft")
        const timerBP: any = NodeCacheObj.get("timerBP")


        newTimeLeft = new Date(insertObj.lastUpdated.getTime() + 60 * 60 * 1000 * msuppLevelInt/msuppInt)

        let timeNotificationLeft
        for (let x = 0; x < timerBP.length; x++) {
            const timeLeftProperty: any = newTimeLeft
            const currentDate: any = new Date()
            if (((timeLeftProperty - currentDate) / 1000) <= timerBP[x]) {
                timeNotificationLeft = x
                break
            }
        }

        msuppObj[cleanedName] = { timeLeft: newTimeLeft, timeNotificationLeft: timeNotificationLeft }
        
        insertObj["timeLeft"] = newTimeLeft
        
        mongoSanitize.sanitize(insertObj, { replaceWith: "_" })
        await collections.facilities.insertOne(insertObj)
        await interaction.editReply({ content: "Added the facility `" + cleanedName + "` successfully." })

    }




    return true;
}


export default spaddfacility
