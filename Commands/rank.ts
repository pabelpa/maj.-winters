import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { getCollections } from "../mongoDB";
import checkPermissions from "../Utils/checkPermissions";
import generateStockpileMsg from "../Utils/generateStockpileMsg";


const EnlistedRanks:any = [
    {
        name:"Private",
        short:"PVT",
        xp:100,
        xpCapacity:100,
        logiPromotable: ["logi2","logi3","logi4","logi5","fac2","fac3","fac4","chief"],
        combatPromotable :["comb2","comb3","comb4","comb5","arty2","arty3","armor2","armor3","chief"],
        engineeringPromotable : ["eng2","eng3","eng4","chief"],


    },
    {
        name:"Private First Class",
        short:"PFC",
        xp:1000,
        xpCapacity:110
    },
    {
        name:"Speacialist",
        short:"SPC",
        xp:3000,
        xpCapacity:120
    },
]
const ncoRank:any = [
    {
        name:"Coporal",
        short:"CPL",
        xp:6000,
        xpCapacity:200,
        logiPromotable: ["logi3","logi4","logi5","fac3","fac4","chief"],
        combatPromotable :["comb3","comb4","comb5","arty3","armor3","chief"],
        engineeringPromotable : ["eng2","eng3","eng4","chief"],
    },
    {
        name:"Sergeant",
        short:"SGT",
        xp:12000,
        xpCapacity:210
    },
    {
        name:"Staff Sergeant",
        short:"SSG",
        xp:18000,
        xpCapacity:220
    },
    {
        name:"Sergeant First Class",
        short:"SFC",
        xp:26000,
        xpCapacity:230
    },
    {
        name:"Master Sergeant",
        short:"MSG",
        xp:35000,
        xpCapacity:240
    },
    {
        name:"First Sergeant",
        short:"1SG",
        xp:45000,
        xpCapacity:250
    },
    {
        name:"Sargeant Major",
        short:"SGM",
        xp:60000,
        xpCapacity:260
    },
    {
        name:"Command Sergeant Major",
        short:"CSM",
        xp:75000,
        xpCapacity:270
    },
    {
        name:"Sergeant Major of the Army",
        short:"SMA",
        xp:100000,
        xpCapacity:280
    },
]

const warrantRank:any = [
    {
        name:"Warrant Officer 1",
        short:"WO1",
        xp:120000,
        xpCapacity:300,
        logiPromotable: ["logi4","logi5","fac4","chief"],
        combatPromotable :["comb4","comb5","chief"],
        engineeringPromotable : ["eng4","chief"],
    },
    {
        name:"Chief Warrant Officer 2",
        short:"CW2",
        xp:180000,
        xpCapacity:310
    },
    {
        name:"Chief Warrant Officer 3",
        short:"CW3",
        xp:250000,
        xpCapacity:320
    },
    {
        name:"Chief Warrant Officer 4",
        short:"CW4",
        xp:500000,
        xpCapacity:330
    },
    {
        name:"Chief Warrant Officer 5",
        short:"CW5",
        xp:1000000,
        xpCapacity:340
    },
]

const officerRank:any = [
    {
        name:"Second Lieutenant",
        short:"2LT",
        xp:120000,
        xpCapacity:300,
        logiPromotable: ["logi5","chief"],
        combatPromotable :["comb5","chief"],
        engineeringPromotable : ["eng4","chief"],
    },
    {
        name:"First Lieutenant",
        short:"1LT",
        xp:180000,
        xpCapacity:340
    },
]

const commanderRank:any = [
    {
        name:"Captian",
        short:"CPT",
        xp:250000,
        xpCapacity:400,
        logiPromotable: ["chief"],
        combatPromotable :["chief"],
        engineeringPromotable : ["chief"],
    },
    {
        name:"Major",
        short:"MAJ",
        xp:500000,
        xpCapacity:400
    },
]

const chiefRank:any = [
    {
        name:"Lieutenant Colonel",
        short:"LTC",
        xp:1000000,
        xpCapacity:1000
    },
    {
        name: "Colonel",
        short: "COL",
        xp: 2000000,
        xpCapacity: 2000
    },
]

const ranks:any = {
    "enlisted":EnlistedRanks,
    "nco":ncoRank,
    "warrant":warrantRank,
    "officer":officerRank,
    "commander":commanderRank,
    "chief":chiefRank
}
const rank = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let collections = getCollections();
    let config = (await collections.config.findOne({}))!
    let ranklist

    let soldier = (interaction.options.getMember("soldier") as GuildMember)
    if (!soldier){
        soldier = (interaction.member as GuildMember)
    }
    for (let group in ranks){
        if (soldier.roles.cache.has(config.rankRoles[group])){
            ranklist = ranks[group]
        }
    }

    if(!ranklist){
        interaction.editReply(
            {
                content:`${soldier.nickname}`+" is not eligible for a rank in this regiment."
            }
        )
        return false
    }
    soldier.user.id
    let members = getCollections().members
    let res:any = await members.findOne({memId:soldier.user.id})
    
    if (res==null){
        let basexp = ranklist[0].xp
        res = {
            memId:soldier.user.id,
            rank:ranklist[0].name,
            short:ranklist[0].short,
            rankIndex:0,
            logiXp:basexp,
            combatXp:basexp,
            engineeringXp:basexp,
            xpGiven:0,
            xpCapacity:ranklist[0].xpCapacity,
            showRank:false,
            showSpec:false,
            ign:""
        }
        let s = await members.insertOne(res)
    }
    if(res.xpCapacity==undefined){
        collections.members.updateOne({_id:res._id},{$set:{xpCapacity:ranklist[res.rankIndex].xpCapacity}})
    }
    let xpNextRank
    if (ranklist[res.rankIndex+1]){
        xpNextRank = ranklist[res.rankIndex+1].xp-Math.max(res.logiXp,res.combatXp,res.engineeringXp)
    } else {
        xpNextRank = 0
    }
        interaction.editReply(
            {
                content:`${soldier.displayName} \n\n# Rank: \`${res.rank}\` \n\n- Combat xp: ${res.combatXp} \n- Logistics xp: ${res.logiXp} \n- Engineering xp: ${res.engineeringXp} \n- xp until next rank: ${xpNextRank}`
            }
        )
    return true
}

export {rank,ranks}