import { Client, ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import { getCollections } from './../mongoDB'
import generateStockpileMsg from "./../Utils/generateStockpileMsg"
import updateStockpileMsg from "../Utils/updateStockpileMsg";
import checkPermissions from "../Utils/checkPermissions";

const spremovefac = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    let facName = interaction.options.getString("name")! // Tell typescript to shut up and it is non-null

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

    if (!facName) {
        await interaction.editReply({
            content: "Missing parameters"
        });
        return false
    }

    
    const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()
    const cleanedName = facName.replace(/\./g, "").replace(/\$/g, "").toLowerCase()
    const searchQuery = new RegExp(`^${cleanedName}$`, "i")
    if ((await collections.facilities.deleteOne({ name: searchQuery })).deletedCount > 0) {
        const configObj = (await collections.config.findOne({}))!


        const msuppsLeft: any = NodeCacheObj.get("msuppsLeft")
        let stockpileTimes: any;

        for (const name in msuppsLeft) {
            if (name.toLowerCase() === cleanedName) {
                delete msuppsLeft[name]
                break
            }
        }
        
    
        await interaction.editReply({
            content: "Successfully deleted the facility " + facName
        });
    }
    else {
        await interaction.editReply({
            content: facName + " facility does not exist."
        });
    }



    return true;
}

export default spremovefac