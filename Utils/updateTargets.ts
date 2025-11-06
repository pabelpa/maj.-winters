// Check if all the target msgs still exist
            // for (let i = 0; i < configObj.targetMsg.length; i++) {
            //     try {
            //         await channelObj.messages.fetch(configObj.targetMsg[i])
            //     }
            //     catch (e: any) {
            //         console.log(e)
            //         if (e.code === 10008) {
            //             configObj.targetMsg.splice(i, 1)
            //             i -= 1
            //             console.log(eventName + "A target msg no longer exists, deleting")
            //             editedMsgs = true
            //             newMsgsSent = true
            //         }
            //     }
            // }

            

            // let updateObj: any = {}

            // // Send the refresh all stockpiles and target msg last
            // if (newMsgsSent) {
            //     try {
            //         const refreshAllID = await channelObj.messages.fetch(configObj.refreshAllID)
            //         if (refreshAllID) await refreshAllID.delete()
            //     }
            //     catch (e) {
            //         console.log("Failed to delete new refresh all button")
            //     }
            //     try {
            //         const refreshAllID = await channelObj.send({ content: "----------\nRefresh the timer of **all stockpiles**", components: [msg[5]] })
            //         updateObj.refreshAllID = refreshAllID.id

            //     } catch (e) {
            //         console.log('Failed to send the refresh all button')
            //     }


            //     let targetMsgIDs = []
            //     let targetMsgFuncArray = []

            //     for (let i = 0; i < configObj.targetMsg.length; i++) {
            //         targetMsgFuncArray.push(deleteTargetMsg(channelObj, configObj.targetMsg[i]))
            //     }
            //     await Promise.all(targetMsgFuncArray)
            //     for (let i = 0; i < msg[2].length; i++) {
            //         try {
            //             const targetMsg = await channelObj.send(msg[2][i])
            //             targetMsgIDs.push(targetMsg.id)
            //         }
            //         catch (e) {
            //             console.log(eventName + "Failed to send a new targetMsg")
            //         }
            //     }
            //     updateObj.targetMsg = targetMsgIDs

            //     const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
            //     const timeCheckDisabled = process.env.STOCKPILER_MULTI_SERVER === "true" ? disableTimeNotif[guildID!] : disableTimeNotif

            //     if (!timeCheckDisabled) checkTimeNotifsQueue(client, true, false, guildID!)
            // }
            // else {
            //     try {
            //         // edit refreshAllID in case the button was pressed
            //         const refreshAllMsg = await channelObj.messages.fetch(configObj.refreshAllID)
            //         await refreshAllMsg.edit({ content: "----------\nRefresh the timer of **all stockpiles**", components: [msg[5]] })
            //     }
            //     catch (e: any) {
            //         if (e.code === 10008) {
            //             editedMsgs = true
            //             newtargetMsgSent = true
            //             console.log(eventName + "Refresh stockpile button not found, sending a new 1")
            //             const newMsg = await channelObj.send({ content: "----------\nRefresh the timer of **all stockpiles**", components: [msg[5]] })
            //             await collections.config.updateOne({}, { $set: { refreshAllID: newMsg.id } })

            //             let targetMsgIDs = []
            //             let targetMsgFuncArray = []

            //             for (let i = 0; i < configObj.targetMsg.length; i++) {
            //                 targetMsgFuncArray.push(deleteTargetMsg(channelObj, configObj.targetMsg[i]))
            //             }
            //             await Promise.all(targetMsgFuncArray)
            //             for (let i = 0; i < msg[2].length; i++) {
            //                 try {
            //                     const targetMsg = await channelObj.send(msg[2][i])
            //                     targetMsgIDs.push(targetMsg.id)
            //                 }
            //                 catch (e) {
            //                     console.log(eventName + "Failed to send a new targetMsg")
            //                 }
            //             }
            //             updateObj.targetMsg = targetMsgIDs

            //             const disableTimeNotif: any = NodeCacheObj.get("disableTimeNotif")
            //             const timeCheckDisabled = process.env.STOCKPILER_MULTI_SERVER === "true" ? disableTimeNotif[guildID!] : disableTimeNotif

            //             if (!timeCheckDisabled) checkTimeNotifsQueue(client, true, false, guildID!)
            //         }
            //     }

            //     let targetMsgFuncArray = []
            //     for (let i = 0; i < msg[2].length; i++) {
            //         if (i < configObj.targetMsg.length) {
            //             const msgObj = await channelObj.messages.fetch(configObj.targetMsg[i])
            //             targetMsgFuncArray.push(editTargetMsg(msg[2][i], msgObj))
            //         }
            //         else {
            //             targetMsgFuncArray.push(newTargetMsg(msg[2][i], channelObj, configObj))
            //         }
            //     }
            //     await Promise.all(targetMsgFuncArray)

            //     const difference2 = configObj.targetMsg.length - msg[2].length
            //     for (let i = 0; i < difference2; i++) {
            //         if (!editedMsgs) editedMsgs = true
            //         try {
            //             msgObj = await channelObj.messages.fetch(configObj.targetMsg[configObj.targetMsg.length - 1])
            //             await msgObj.delete()
            //         }
            //         catch (e) {
            //             console.log(eventName + "Failed to delete last unused target msg. It might no longer exist")
            //         }
            //         configObj.targetMsg.pop()

            //     }
            //     updateObj.targetMsg = configObj.targetMsg
            // }