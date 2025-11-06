import { Client, TextChannel } from "discord.js"
import { getCollections } from "../mongoDB"
import { roleMention } from '@discordjs/builders';
const eventName = "[Stockpile Expiry Checker]: "
let queue: Array<any> = []
let multiServerQueue: any = {}

const checkTimeNotifsQueue = async (client: Client, forceEdit: boolean = false, regularUpdate: boolean = false, guildID: string = "PLACEHOLDER"): Promise<Boolean> => {
    
    queue.push({ client: client, forceEdit: forceEdit, regularUpdate: regularUpdate, guildID: guildID })

    if (queue.length === 1) {
        console.log(eventName + "No time check event queue ahead. Starting")

        checkTimeNotifs(queue[0].client, queue[0].forceEdit, queue[0].regularUpdate, queue[0].guildID)
    }
    else {
        console.log(eventName + "Update event ahead queued, current length in queue: " + queue.length)
    }

    return true
}
const checkTimeNotifs = async (client: Client, forceEdit: boolean = false, regularUpdate: boolean = false, guildID: string = "PLACEHOLDER") => {
    const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
    const timerBP = <number[]>NodeCacheObj.get("timerBP")

    const msuppsLeft: any = NodeCacheObj.get("msuppsLeft")
    const stockpileTimes: any = NodeCacheObj.get("stockpileTimes")

    if (disableTimeNotif) return false
    
    console.log(eventName + "Checking time now")

    let edited = false

    const collections = getCollections()

    let warningMsg = `**Stockpile Expiry Warning**\nThe following stockpiles are about to expire, please kindly refresh them.\n\n`
    
    if (forceEdit) edited = true

    for (const stockpileName in stockpileTimes) {
        //expire date in ms since 1970
        const ExpireTime: any = stockpileTimes[stockpileName].expireDate
        let prettyName = stockpileTimes[stockpileName].prettyName

        //current date in ms since 1970
        const currentDate: any = new Date()

        if (stockpileTimes[stockpileName].nextBreakPointIndex >= 0) {

            //seconds
            const timeLeft = (ExpireTime - currentDate) / 1000
            let nextBreakPoint = timerBP[stockpileTimes[stockpileName].nextBreakPointIndex]
            if (timeLeft <= nextBreakPoint) {
                console.log(eventName + "A stockpile has passed a set time left and is about to expire. Sending out warning.")
                stockpileTimes[stockpileName].nextBreakPointIndex --

                edited = true
                warningMsg += `- \`${prettyName ? prettyName : stockpileName}\` expires in <t:${Math.floor(ExpireTime.getTime() / 1000)}:R> ${prettyName ? "[a.k.a " + stockpileName + "]" : ""}\n`
            }
        }
    }
    
    warningMsg += `**Msupp Expiry Warning**\nThe following facilities are about to run out of msupps, please kindly add more to them.\n\n`
    for (const fac in msuppsLeft){
        const expireTime: any = msuppsLeft[fac].expireDate
        const currentDate: any = new Date()
        if (msuppsLeft[fac].nextBreakPointIndex >= 0) {

            const timeLeft = (expireTime - currentDate) / 1000
            let nextBreakPoint = timerBP[msuppsLeft[fac].nextBreakPointIndex]
            if (timeLeft <= nextBreakPoint) {
                console.log(eventName + "A facility has passed a set time left and is about to expire. Sending out warning.")
                // Detected a stockpile that has past the allocated boundary expiry time
                msuppsLeft[fac].timeNotificationLeft--

                edited = true
                warningMsg += `- \`${fac}\` will run out of msupps <t:${Math.floor(expireTime / 1000)}:R>\n`
            }
        }
    }

    // TODO: Create bot alerts channel
    // if (edited) {
    //     const configObj = (await collections.config.findOne({}))!
    //     if ("channelId" in configObj) {
    //         if ("notifRoles" in configObj && warningMsg.length > 104) {
    //             warningMsg += "\n"
    //             for (let i = 0; i < configObj.notifRoles.length; i++) {
    //                 warningMsg += roleMention(configObj.notifRoles[i])
    //             }

    //         }
    //         const channelObj = client.channels.cache.get(configObj.channelId) as TextChannel
    //         if (channelObj) {
    //             if ("warningMsgId" in configObj) {
    //                 try {
    //                     const stockpileMsg = await channelObj.messages.fetch(configObj.warningMsgId)
    //                     if (stockpileMsg) await stockpileMsg.delete()
    //                 }
    //                 catch (e) {
    //                     console.log(e)
    //                     console.log("Failed to delete warning msg")
    //                 }
    //             }
    //             const MsgID = await channelObj.send(warningMsg)
    //             await collections.config.updateOne({}, { $set: { warningMsgId: MsgID.id } })
    //             console.log(eventName + "Sent out warning msg (Note: This does not constitute a stockpile is about to expire)")
    //         }
    //         else console.log(eventName + "Failed to send out warning msg")
            

    //     }
    // }

    queue.splice(0, 1)
    if (queue.length > 0) {
        console.log(eventName + "Finished 1, starting next in queue, remaining queue: " + queue.length)
        checkTimeNotifs(queue[0].client, queue[0].forceEdit, queue[0].regularUpdate, queue[0].guildID)
    }




}

export default checkTimeNotifsQueue
