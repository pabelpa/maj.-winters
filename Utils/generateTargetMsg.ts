// import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
// import { getCollections } from '../mongoDB';
// const generateStockpileMsg = async (updateMsg: boolean, guildID: string | null,stockpile:any): Promise<Array<any>> => {
//     const collections = getCollections()
//     const timeCheckDisabled: any = NodeCacheObj.get("disableTimeNotif")
//     const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal")
//     const prettyName: any = NodeCacheObj.get("prettyName")

//     let stockpileHeader = "**__Stockpiler Discord Bot Report__** \n_All quantities in **crates**_"
//     let locationMappings: any = NodeCacheObj.get("locationMappings")
//     let stockpileMsgsHeader = "**__Stockpiles__** \n\n ----------"

//     let targetMsgs = NodeCacheObj.get("targetMsgs") as Array<string>
//     let code: any = {}
//     let stockpileLocations: any = {}
//             targetMsgs = []
//         let stockpileGroupMsg = "----------\n\n**__Stockpile Groups Targets__** \n\n"
//         if (stockpileGroups && Object.keys(stockpileGroups).length > 0) {

//             for (const stockpileGroup in stockpileGroups) {

//                 // Calculate totals for the current stockpileGroup
//                 const stockpileGroupTotals: any = {}
//                 const currentStockpilesInGroup = stockpileGroups[stockpileGroup].stockpiles
//                 let stockpileNames = ""

//                 for (let i = 0; i < stockpiles.length; i++) {
//                     if (stockpiles[i].name.toLowerCase() in currentStockpilesInGroup) {
//                         const currentItems = stockpiles[i].items
//                         for (const item in currentItems) {
//                             if (item in stockpileGroupTotals) stockpileGroupTotals[item] += currentItems[item]
//                             else stockpileGroupTotals[item] = currentItems[item]
//                         }
//                         stockpileNames += stockpiles[i].name + ", "
//                     }
//                 }
//                 stockpileNames = stockpileNames.slice(0, stockpileNames.length-2)


//                 let sortedTargets: any = {}
//                 const stockpileGroupTargets = stockpileGroups[stockpileGroup].targets
//                 for (const target in stockpileGroups[stockpileGroup].targets) {
//                     const currentCat = itemListCategoryMapping[target]
//                     let icon = "❌"

//                     if ("max" in stockpileGroupTargets[target] && stockpileGroupTargets[target].max != 0 && stockpileGroupTotals[target] > stockpileGroupTargets[target].max) {
//                       icon = "🟢"  
//                     }
//                     else {
//                         if (stockpileGroupTotals[target] >= stockpileGroupTargets[target].min) icon = "✅"
//                         else {
//                             const percentage = stockpileGroupTotals[target] / stockpileGroupTargets[target].min
//                             if (percentage >= 0.75) icon = "🟡"
//                             else if (percentage >= 0.5) icon = "🔴"
//                         }
//                     }
                    

//                     const currentMsg = `${target in stockpileGroupTotals ? stockpileGroupTotals[target] : "0"}/${stockpileGroupTargets[target].min} ${icon} - \`${lowerToOriginal[target]}\` (Max: ${stockpileGroupTargets[target].max === 0 ? "∞" : stockpileGroupTargets[target].max}) ${"prodLocation" in stockpileGroupTargets[target] && typeof stockpileGroupTargets[target].prodLocation === 'string' ? "[" + stockpileGroupTargets[target].prodLocation + "]" : ""}\n`


//                     if (currentCat in sortedTargets) sortedTargets[currentCat].push(currentMsg)
//                     else sortedTargets[currentCat] = [currentMsg]
//                 }

//                 stockpileGroupMsg += `**\`${stockpileGroup}\`** Group Target ${stockpileNames.length > 0 ? "(\`" + stockpileNames + "\`)" : "(`No Stockpiles❗`)"} \n`

//                 for (const category in sortedTargets) {
//                     stockpileGroupMsg += "__" + category + "__\n"
//                     for (let i = 0; i < sortedTargets[category].length; i++) {
//                         stockpileGroupMsg += sortedTargets[category][i]
//                     }
//                 }

//                 stockpileGroupMsg += "\n-------------\n"
//             }



//             while (stockpileGroupMsg.length > 2000) {

//                 const sliced = stockpileGroupMsg.slice(0, 2000)
//                 const lastEnd = sliced.lastIndexOf("\n")
//                 const finalMsg = sliced.slice(0, lastEnd)

//                 targetMsgs.push(finalMsg)
//                 stockpileGroupMsg = stockpileGroupMsg.slice(lastEnd, stockpileGroupMsg.length)
//             }
//             targetMsgs.push(stockpileGroupMsg)
//         }


//         let targetMsg = "**__Global Targets__** \n\n"
//         if (targets) {
//             let sortedTargets: any = {}
//             for (const target in targets) {
//                 if (target !== "_id") {
//                     const currentCat = itemListCategoryMapping[target]
                    
//                     let icon = "❌"

//                     if ("max" in targets[target] && targets[target].max != 0 && totals[target] >= targets[target].max) icon = "🟢"
//                     else {
//                         if (totals[target] >= targets[target].min) icon = "✅"
//                         else {
//                             const percentage = totals[target] / targets[target].min
//                             if (percentage >= 0.75) icon = "🟡"
//                             else if (percentage >= 0.5) icon = "🔴"
//                         }
//                     }
                   
//                     const currentMsg = `${target in totals ? totals[target] : "0"}/${targets[target].min} ${icon} - \`${lowerToOriginal[target]}\` (Max: ${targets[target].max === 0 ? "∞" : targets[target].max}) ${"prodLocation" in targets[target] && typeof targets[target].prodLocation === 'string' ? "[" + targets[target].prodLocation + "]" : ""}\n`

//                     if (currentCat in sortedTargets) sortedTargets[currentCat].push(currentMsg)
//                     else sortedTargets[currentCat] = [currentMsg]
//                 }
//             }

//             for (const category in sortedTargets) {
//                 targetMsg += "__" + category + "__\n"
//                 for (let i = 0; i < sortedTargets[category].length; i++) {
//                     targetMsg += sortedTargets[category][i]
//                 }
//             }

//             while (targetMsg.length > 2000) {

//                 const sliced = targetMsg.slice(0, 2000)
//                 const lastEnd = sliced.lastIndexOf("\n")
//                 const finalMsg = sliced.slice(0, lastEnd)

//                 targetMsgs.push(finalMsg)
//                 targetMsg = targetMsg.slice(lastEnd, targetMsg.length)
//             }
//             targetMsgs.push(targetMsg)
//         }
//         targetMsg += "\n"