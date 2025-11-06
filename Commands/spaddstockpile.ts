import { Client, ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from '../mongoDB'
import generateStockpileMsg from "../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";
import mongoSanitize from "express-mongo-sanitize";

const spaddstockpile = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
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
    const stockpileExist = await collections.stockpiles.findOne({ name: cleanedName })
    if (stockpileExist) {
        await interaction.editReply({ content: "The stockpile with the name `" + stockpile + "` already exists." })
    }
    else {
        let insertObj: any = {
            name: cleanedName, items: {}, lastUpdated: new Date()
        }
        const configObj = (await collections.config.findOne({}))!

        mongoSanitize.sanitize(insertObj, { replaceWith: "_" })
        let instertedObj = await collections.stockpiles.insertOne(insertObj)
        await interaction.editReply({ content: "Added the stockpile `" + stockpile + "` successfully." })

        let updatedStockpile = await collections.stockpiles.findOne({_id:instertedObj.insertedId})
        await updateStockpileMsg(client, interaction.guildId,updatedStockpile,true)
    }

    return true;
}

export default spaddstockpile
