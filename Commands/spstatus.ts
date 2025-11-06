import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from "../Utils/generateStockpileMsg";

const spstatus = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let stockpile = interaction.options.getString("stockpile")!
    let filter = interaction.options.getString("filter")!
    const stockpileGroup = interaction.options.getString("stockpile_group")


    if (!(await checkPermissions(interaction, "user", interaction.member as GuildMember))) return false
    
    // if (filter) {
    //     if (filter === "targets") {
    //         await interaction.editReply(targetMsgs[0])
    //         for (let i = 1; i < targetMsgs.length; i++) {
    //             await interaction.followUp({ content: targetMsgs[i], ephemeral: true })
    //         }
    //     }
    //     else if (filter === "group_targets") {
    //         await interaction.editReply(targetMsgs[0])
    //         for (let i = 1; i < targetMsgs.length; i++) {
    //             if (targetMsgs[i].indexOf("Global Targets") !== -1) break
    //             await interaction.followUp({ content: targetMsgs[i], ephemeral: true })
    //         }
    //     }
    // }
    // else if (stockpileGroup) {
    //     let startSending = false
    //     for (let i = 0; i < targetMsgs.length; i++) {
    //         const startPosition = targetMsgs[i].indexOf("**\`" + stockpileGroup)
    //         if (startPosition !== -1) {
    //             startSending = true
    //         }

    //         const endPosition = targetMsgs[i].indexOf("\n-------------\n", startPosition)
    //         // Final msg to send out (in the case of the target msg not being the entire element)
    //         if (startSending) {
    //             if (endPosition !== -1) {
    //                 const finalMsg = targetMsgs[i].slice(startPosition, endPosition)
    //                 await interaction.followUp({ content: finalMsg, ephemeral: true })
    //                 break
    //             }
    //             else await interaction.followUp({ content: targetMsgs[i], ephemeral: true })
            
    //         }
    //     }

    //     if (!startSending) await interaction.editReply({ content: "Error, no stockpile group named `" + stockpileGroup + "` found." })

    // }


    // find one stockpile given a name
    else if (stockpile) {
        let found = false
        const collections = getCollections()

        stockpile = stockpile.replace(/\./g, "").replace(/\$/g, "")
        const lowerCaseStockpileName = stockpile.toLowerCase()

        const itemListCategoryMapping: any = NodeCacheObj.get("itemListCategoryMapping")
        const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")
        let locationMappings: any = NodeCacheObj.get("locationMappings")
        const timeCheckDisabled: any = NodeCacheObj.get("disableTimeNotif")
        
        
        const stockpiles = await collections.stockpiles.find({}).toArray()

        for (let i = 0; i < stockpiles.length; i++) {
            const current = stockpiles[i]

            if (current.name.toLowerCase() === lowerCaseStockpileName) {
                found = true
                let prettyName
                if ("prettyName" in current){
                    prettyName = current.prettyName
                }
                
                let name = `**${prettyName ? prettyName : current.name}**`
                
                let lastScan = `(last scan: <t:${Math.floor(current.lastUpdated.getTime() / 1000)}:R>)` 
                
                let expiry = ""
                if ("expireDate" in current && !timeCheckDisabled){
                    if ("upperBound" in current){
                        expiry = `[Expiry: Sometime between: <t:${Math.floor(current.expireDate.getTime() / 1000)}:R> and <t:${Math.floor(current.upperBound.getTime() / 1000)}:R>]`
                    } else {
                        expiry = `[Expiry: <t:${Math.floor(current.expireDate.getTime() / 1000)}:R>]`
                    }
                    
                } 
                let aka = `${prettyName? " [a.k.a " + current.name + "]" : ""}\n`
                
                let current_code = ""
                let currentLocation  = ""
                let code = current.code
                let location = current.location
                if (code) current_code = `**Stockpile Code:** \`${code}\`\n`
                if (location) currentLocation = `**Location:** \`${locationMappings[location]}\`\n\n`
                
                let msg = await generateStockpileMsg(false,current)
                
                interaction.editReply({content:name+'\n'+lastScan +"\n"+expiry+"\n"})
                interaction.followUp({embeds:msg})
              

            }
        }

        if (!found) {
            await interaction.editReply("Error: The stockpile `" + stockpile + "` was not found.")
        }
    }
    // else {
    //     await interaction.editReply(stockpileHeader);
    //     await interaction.followUp({ content: stockpileMsgsHeader, ephemeral: true })
    //     for (let i = 0; i < stockpileMsgs.length; i++) {
    //         if (typeof stockpileMsgs[i] !== "string") await interaction.followUp({ content: stockpileMsgs[i][0], ephemeral: true });
    //         else await interaction.followUp({ content: stockpileMsgs[i], ephemeral: true });
    //     }
    //     for (let i = 0; i < targetMsgs.length; i++) {
    //         await interaction.followUp({ content: targetMsgs[i], ephemeral: true });
    //     }
    // }



    return true;
}

export default spstatus