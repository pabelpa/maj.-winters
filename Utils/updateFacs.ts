// import { Client, Message, ActionRowBuilder, TextChannel, ButtonBuilder,ThreadAutoArchiveDuration, Embed } from "discord.js"
// import { getCollections } from '../mongoDB';
// import checkTimeNotifsQueue from "./checkTimeNotifs";
// let queue: Array<any> = []
// let multiServerQueue: any = {}
// let editedMsgs = false
// let newMsgsSent = false
// let newtargetMsgSent = false
// const eventName = "[Update Logi Channel]: "
// const numberOfCategories = 9
// const stockpileCategories = [
//     "smallArms",
//     "heavyArms",
//     "heavyAmmunitions",
//     "utility",
//     "medical",
//     "resource",
//     "uniforms",
//     "vehicles",
//     "shippables",
// ]

// const updateStockpileMsgEntryPoint = async (client: Client, guildID: string | null, msg: [string, Array<string>, Array<string>, Array<string>, string, ActionRowBuilder]): Promise<Boolean> => {

//         queue.push({ client: client, guildID: guildID, msg: msg })

//         if (queue.length === 1) {
//             console.log(eventName + "No queue ahead. Starting")

//             updateStockpileMsg(queue[0].client, queue[0].guildID, queue[0].msg)
//         }
//         else {
//             if (queue.length > 2) {
//                 console.log(eventName + "Queue length exceeded allowed quantity, skipping middle ones")
//                 queue.splice(1, queue.length - 1)
//             }
//             console.log(eventName + "Update event ahead queued, current length in queue: " + queue.length)
//         }

//     return true
// }

// const editStockpileMsg = async (currentMsg: string | [string, ActionRowBuilder<ButtonBuilder>], msgObj: Message): Promise<Boolean> => {

//     try {
//         if (typeof currentMsg !== "string") await msgObj.edit({ content: currentMsg[0], components: [currentMsg[1]] })
//         else await msgObj.edit({ content: currentMsg, components: [] })
//     }
//     catch (e) {
//         console.log(e)
//         console.log(eventName + "Failed to edit a stockpile msg, it might no longer exist. Skipping...")
//     }

//     return true
// }

// const newStockpileMsg = async (currentMsg: string | [string, ActionRowBuilder<ButtonBuilder>], configObj: any, channelObj: TextChannel): Promise<Boolean> => {

//     try {
//         // The issue here is that when adding a new stockpile, a new msg has to be sent
//         // Unfortunately, it takes a long time to send that new msg, hence when 2 requests to add the same new stockpile happen
//         // The 1st request wouldn't have updated the database that a new msg has already been sent, leading to another new msg being sent
//         // and the 2nd request's configObj.stockpileMsgs overrides the 1st one
//         let newMsg: any;
//         if (typeof currentMsg !== "string") newMsg = await channelObj.send({ content: currentMsg[0], components: [currentMsg[1]] })
//         else newMsg = await channelObj.send(currentMsg)
//         configObj.stockpileMsgs.push(newMsg.id)
//         if (!editedMsgs) editedMsgs = true
//         newMsgsSent = true

//     }
//     catch (e) {
//         console.log(e)
//         console.log(eventName + "Failed to send a stockpile msg, skipping...")
//     }
//     return true
// }

// const newFacMsg = async (currentMsg: string | [string, ActionRowBuilder<ButtonBuilder>], configObj: any, channelObj: TextChannel): Promise<Boolean> => {

//     try {
//         // The issue here is that when adding a new stockpile, a new msg has to be sent
//         // Unfortunately, it takes a long time to send that new msg, hence when 2 requests to add the same new stockpile happen
//         // The 1st request wouldn't have updated the database that a new msg has already been sent, leading to another new msg being sent
//         // and the 2nd request's configObj.stockpileMsgs overrides the 1st one
//         let newMsg: any;
//         if (typeof currentMsg !== "string") newMsg = await channelObj.send({ content: currentMsg[0], components: [currentMsg[1]] })
//         else newMsg = await channelObj.send(currentMsg)
//         configObj.facMsg.push(newMsg.id)
//         if (!editedMsgs) editedMsgs = true
//         newMsgsSent = true

//     }
//     catch (e) {
//         console.log(e)
//         console.log(eventName + "Failed to send a stockpile msg, skipping...")
//     }
//     return true
// }

// const editTargetMsg = async (currentMsg: string, msgObj: Message) => {
//     try {
//         await msgObj.edit(currentMsg)
//     }
//     catch (e) {
//         console.log(e)
//         console.log(eventName + "Failed to edit a target msg, it might no longer exist. Skipping...")
//     }
// }

// const newTargetMsg = async (currentMsg: string, channelObj: TextChannel, configObj: any) => {
//     const newMsg = await channelObj.send(currentMsg)
//     configObj.targetMsg.push(newMsg.id)
//     if (!editedMsgs) editedMsgs = true
//     newtargetMsgSent=true
// }

// const deleteTargetMsg = async (channelObj: TextChannel, currentMsgID: string) => {
//     try {
//         const targetMsg = await channelObj.messages.fetch(currentMsgID)
//         await targetMsg.delete()
//     }
//     catch (e) {
//         console.log(e)
//         console.log(eventName + "Failed to delete a targetMsg")
//     }
// }




// const updateStockpileMsg = async (client: Client, guildID: string | null, msg: Embed[][]): Promise<Boolean> => {
//     let channelObj = null
//     try {
//         const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(guildID) : getCollections()

//         const configObj = (await collections.config.findOne({}))!
//         const stockpiles = (await collections.stockpiles.find({}).toArray())!


//         // update msg if logi channel is set
//         if ("channelId" in configObj) {
//             channelObj = client.channels.cache.get(configObj.channelId) as TextChannel
//             for (let i = 0; i<stockpiles.length;i++){
//                 let thread 
//                 try{
//                     let threadId = configObj.stockpileThreads[i]
//                     thread = await channelObj.threads.fetch(threadId)
//                 }catch{
//                     console.log("Thread does not exist for this stockpile. creating one")
//                     thread = await channelObj.threads.create({
//                         name: "Stockpile",
//                         autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
//                         reason: "Tracking Stockpile",
//                     });
//                     collections.config.updateOne({},{$push:{stockpileThreads:thread.id}})
//                 }
//                 let stockpile = stockpiles[i]
//                 // Check if all the stockpile msgs still exist
//                 let smallArms
//                 let heavyArms
//                 let heavyAmmunition
//                 let utility
//                 let medical
//                 let resource
//                 let uniforms
//                 let vehicles
//                 let shippables

//                 try {
//                     smallArms =await thread?.messages.fetch(stockpile.smallArmsMsg)
//                     heavyArms = await thread?.messages.fetch(stockpile.heavyArmsMsg)
//                     heavyAmmunition = await thread?.messages.fetch(stockpile.heavyAmmunitionMsg)
//                     utility = await thread?.messages.fetch(stockpile.utilityMsg)
//                     medical = await thread?.messages.fetch(stockpile.medicalMsg)
//                     resource = await thread?.messages.fetch(stockpile.resourceMsg)
//                     uniforms = await thread?.messages.fetch(stockpile.uniformsMsg)
//                     vehicles = await thread?.messages.fetch(stockpile.vehiclesMsg)
//                     shippables = await thread?.messages.fetch(stockpile.shippablesMsg)

//                     smallArms?.edit({embeds:[msg[i][0]]})
//                 }catch{
//                     console.log(eventName + "A stockpile msg no longer exists, recreating all of them")
//                     for (let j=0;j<numberOfCategories;j++){
//                         try{
//                             const msg = await thread?.messages.fetch(stockpile[stockpileCategories[j]+"Msg"])
//                             await msg?.delete()
//                         } catch {
//                             console.log(eventName + `${stockpileCategories[j]} was not found`)
//                         }
//                         const newMsg = await thread?.send({embeds:[msg[i][j]]})
//                         const updateObj:any = {}
//                         updateObj[`${stockpileCategories[j]}Msg`] = newMsg?.id
//                         await collections.stockpiles.updateOne({_id:stockpile._id},{$set:updateObj})
//                     }

//                 }
//             }
//         }
//     }
// }

//            // Check if all the fac msgs still exist
//             for (let i = 0; i < configObj.facMsg.length; i++) {
//                 try {
//                     await channelObj.messages.fetch(configObj.facMsg[i])
//                 }
//                 catch (e: any) {
//                     if (e.code === 10008) {
//                         configObj.facMsg.splice(i, 1)
//                         i -= 1
//                         console.log(eventName + "A stockpile msg no longer exists, deleting")
//                         editedMsgs = true
//                     }
//                 }
//             }
//             if (newMsgsSent || newtargetMsgSent){
                
//                 let updateFacFuncArray = []
//                 let facMsgIDs = []
//                 for (let i = 0; i < configObj.facMsg.length; i++) {
//                     updateFacFuncArray.push(deleteTargetMsg(channelObj, configObj.facMsg[i]))
//                 }
//                 for (let i = 0; i < msg[3].length; i++) {
//                     try {
//                         const targetMsg = await channelObj.send(msg[2][i])
//                         facMsgIDs.push(targetMsg.id)
//                     }
//                     catch (e) {
//                         console.log(eventName + "Failed to send a new facMsg")
//                     }
//                 }

//                 updateObj.facMsg = facMsgIDs


//                 checkTimeNotifsQueue(client, true, false, guildID!)

//             } else {
//                 let updateFacFuncArray = []
//                 for (let i = 0; i < msg[3].length; i++) {
//                     if (i < configObj.facMsg.length) {
//                         msgObj = await channelObj.messages.fetch(configObj.facMsg[i])
//                         updateFacFuncArray.push(editStockpileMsg(msg[3][i], msgObj))
//                     }
//                     else {
//                         updateFacFuncArray.push(newFacMsg(msg[3][i], configObj, channelObj))
//                     }
//                 }
//                 await Promise.all(updateFacFuncArray)
    
//                 const difference_fac = configObj.facMsg.length - msg[3].length
//                 for (let i = 0; i < difference_fac; i++) {
//                     if (!editedMsgs) editedMsgs = true
//                     try {
//                         msgObj = await channelObj.messages.fetch(configObj.facMsg[configObj.facMsg.length - 1])
//                         await msgObj.delete()
//                     }
//                     catch (e) {
//                         console.log(eventName + "Failed to delete an unused facility msg")
//                     }
//                     configObj.facMsg.pop()
    
//                 }
//                 updateObj.targetMsg = configObj.targetMsg
//             }
//             if (editedMsgs) {
//                 updateObj.stockpileMsgs = configObj.stockpileMsgs
//                 await collections.config.updateOne({}, { $set: updateObj })
//             }
//         }