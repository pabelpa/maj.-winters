import { Client, Message, ActionRowBuilder, TextChannel, ButtonBuilder,ThreadAutoArchiveDuration, Embed,ButtonStyle, ForumChannel } from "discord.js"
import { getCollections } from '../mongoDB';
import checkTimeNotifsQueue from "./checkTimeNotifs";
import generateMsg from "./generateStockpileMsg";
let queue: Array<any> = []

const eventName = "[Update Logi Channel]: "


const updateStockpileMsgEntryPoint = async (client: Client, guildID: string | null, stockpile:any,updateMsg:boolean): Promise<Boolean> => {

        queue.push({ client: client, guildID: guildID, stockpile: stockpile })

        if (queue.length === 1) {
            console.log(eventName + "No queue ahead. Starting")

            updateStockpileMsg(queue[0].client, queue[0].guildID, queue[0].stockpile,updateMsg)
        }
        else {
            if (queue.length > 2) {
                console.log(eventName + "Queue length exceeded allowed quantity, skipping middle ones")
                queue.splice(1, queue.length - 1)
            }
            console.log(eventName + "Update event ahead queued, current length in queue: " + queue.length)
        }

    return true
}

const updateStockpileMsg = async (client: Client, guildID: string | null, stockpile:any, updateMsg: boolean): Promise<Boolean> => {
    const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
    let locationMappings: any = NodeCacheObj.get("locationMappings")
    let prettyName
    if ("prettyName" in stockpile){
        prettyName = stockpile.prettyName
    }
    
    let name = `${prettyName ? prettyName : stockpile.name}`
    
    let lastScan = `(last scan: <t:${Math.floor(stockpile.lastUpdated.getTime() / 1000)}:R>)` 
    
    let expiry = ""
    if ("expireDate" in stockpile && !disableTimeNotif){
        if ("upperBound" in stockpile){
            expiry = `[Expiry: Sometime between: <t:${Math.floor(stockpile.expireDate.getTime() / 1000)}:R> and <t:${Math.floor(stockpile.upperBound.getTime() / 1000)}:R>]`
        } else {
            expiry = `[Expiry: <t:${Math.floor(stockpile.expireDate.getTime() / 1000)}:R>]`
        }
        
    } 
    let aka = `${prettyName? " [a.k.a " + stockpile.name + "]" : ""}\n`
    
    let current_code = ""
    let currentLocation  = ""
    let code = stockpile.code
    let location = stockpile.location
    if (code) current_code = `**Stockpile Code:** \`${code}\``
    if (location) currentLocation = `**Location:** \`${locationMappings[location]}\``
    
    let msgs = await generateMsg(updateMsg,stockpile)

    const refreshButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('spsettimeleft==' + stockpile.name)
                .setLabel("Refresh Timer")
                .setStyle(ButtonStyle.Primary)
        );

    
    let channelObj = null
    try {
        const collections = getCollections()
        const configObj = (await collections.config.findOne({}))!

        // update msg if logi channel is set
        if ("stockpileChannelId" in configObj) {
            channelObj = client.channels.cache.get(configObj.stockpileChannelId) as ForumChannel

            let thread 
            try{
                let threadId = stockpile.thread
                thread = await channelObj.threads.fetch(threadId)
                thread?.edit({
                    name:name+" "+aka,
                })
                let message = await thread?.messages.fetch(stockpile.threadHeaderMessage)
                message?.edit({content: current_code+"\n"+currentLocation+"\n"+lastScan +"\n"+expiry+"\n",components:[refreshButton]})
            }catch{
                console.log("Thread does not exist for this stockpile. creating one")
                thread = await channelObj.threads.create({
                    name: name+aka,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                    reason: "Tracking Stockpile",
                    message:{content: current_code+"\n"+currentLocation+"\n"+lastScan +"\n"+expiry+"\n",components:[refreshButton]},
                });
                collections.stockpiles.updateOne({_id:stockpile._id},{$set:{
                    thread:thread.id,
                    threadHeaderMessage:thread.lastMessageId
                }})  
            }

            let msgIds = stockpile.msgIds
            if (!msgIds){
                msgIds ={}
            }
            for (let stockpileCategory in msgs){
                let msgObj = msgs[stockpileCategory]
                try {
                    
                    let embedMsg =await thread?.messages.fetch(stockpile.msgIds[stockpileCategory])
                    embedMsg?.edit(msgObj)
    
                }catch{
                    console.log(eventName + "A stockpile msg no longer exists, recreating it")
                    const newMsg = await thread?.send(msgObj)
                    
                    msgIds[stockpileCategory]=newMsg?.id
                    await collections.stockpiles.updateOne({_id:stockpile._id},{$set:{msgIds:msgIds}})
                
                }

            }
        }
 

    } catch (e) {
        console.log(e)
        console.log(eventName + "An error occurred updating msgs, skipping this update event for now...")
        let errorDump = JSON.stringify(e, Object.getOwnPropertyNames(e))
        if (channelObj) {
            // await channelObj.send({
            //     content: "An error has occurred while updating msgs. Please kindly report this to the developer on Discord (Tkai#8276) with the following logs. \n\n In the meantime, please kindly reset the channel updating using `/splogichannel set <logi_channel>`"
            // })
            while (errorDump.length > 0) {
                if (errorDump.length > 2000) {
                    const sliced = errorDump.slice(0, 2000)
                    const lastEnd = sliced.lastIndexOf("\n")
                    const finalMsg = sliced.slice(0, lastEnd)

                    // await channelObj.send({
                    //     content: finalMsg,
                    // });
                    errorDump = errorDump.slice(lastEnd, errorDump.length)
                }
                else {
                    // await channelObj.send({
                    //     content: errorDump,
                    // });
                    errorDump = ""
                }
            }
        }
    }

    queue.splice(0, 1)
    if (queue.length > 0) {
        console.log(eventName + "Finished 1 logi channel update, starting next in queue, remaining queue: " + queue.length)
        updateStockpileMsg(queue[0].client, queue[0].guildID, queue[0].stockpile,updateMsg)
    }
    else console.log(eventName + "logi channel updates completed")
    return true
}

export default updateStockpileMsgEntryPoint

