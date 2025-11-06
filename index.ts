import { Interaction, Client, Guild, GatewayIntentBits,IntentsBitField } from "discord.js";
import { insertCommands } from "./deploy-commands";
import { open, getCollections, getMongoClientObj } from "./mongoDB";
import sphelp from "./Commands/sphelp";
import spsetamount from "./Commands/spsetamount";
import spstatus from "./Commands/spstatus";
import spsettarget from "./Commands/spsettarget";
import spremovetarget from "./Commands/spremovetarget";
import spsetpassword from "./Commands/spsetpassword";
import spsetlogichannel from "./Commands/spsetlogichannel";
import spremovelogichannel from "./Commands/spremovelogichannel";
import NodeCache from "node-cache";
import spremovestockpile from "./Commands/spremovestockpile";
import spaddstockpile from "./Commands/spaddstockpile";
import spnotif from "./Commands/sptimeoutnotif";
import sprole from "./Commands/sprole";
import stockpilerUpdateStockpile from "./Utils/stockpilerUpdateStockpile";
import spitems from "./Commands/spitems";
import buttonHandler from "./Utils/buttonHandler";
import checkTimeNotifs from "./Utils/checkTimeNotifs";
import http from "http";
import crypto from "crypto";
import argon2 from "argon2";
import spsettimeleft from "./Commands/spsettimeleft";
import fs from "fs";
import csv from "csv-parser";
import spaddprettyname from "./Commands/spaddprettyname";
import spremoveprettyname from "./Commands/spremoveprettyname";
import sppurgestockpile from "./Commands/sppurgestockpile";
import spaddcode from "./Commands/spaddcode";
import spremovecode from "./Commands/spremovecode";
import spaddloc from "./Commands/spaddloc";
import spremoveloc from "./Commands/spremoveloc";
import splistloc from "./Commands/splistloc";
import spfind from "./Commands/spfind";
import spdisabletime from "./Commands/spdisabletime";
import spgroup from "./Commands/spgroup";
import sprefresh from "./Commands/sprefresh";
import spuser from "./Commands/spuser";
import autoCompleteHandler from "./Utils/autoCompleteHandler";
import { UPDATE_DATE, VERSION } from "./constants";
import spaddfacility from "./Commands/spaddfacility";
import spsetmsupp from "./Commands/spsetmsupp";
import spmsuppcons from "./Commands/spmsuppcons";
import spremovefac from "./Commands/spremovefac";
import createLogisticsTicket from "./Commands/create-logistics-ticket";
import enlist from "./Commands/enlist"
import setActiveRole from "./Commands/set-active-role"
import setInactiveRole from "./Commands/set-inactive-role"
import SetLogiTicketChannel from "./Commands/set-logi-ticket-channel"
import lbAdd from "./Commands/lb-add";
import setLogiTicketChannel from "./Commands/set-logi-ticket-channel";
import messageListener from "./Utils/messageListener"
import deliver from "./Commands/deliver";
import lbRemove from "./Commands/lb-remove";
import lbView from "./Commands/lb-view";
import lbDiscard from "./Commands/lb-discard";
import lbComplete from "./Commands/lb-complete";
import {categories} from "./Utils/createStockpileEmbed"
import { arrayBuffer } from "stream/consumers";
import createForumChannel from "./Commands/create-channels"
import setBotChannelCat from "./Commands/set-bot-channel-cat"
import setRankRoles from "./Commands/set-rank-roles";
import {rank} from "./Commands/rank";
import displayRank from "./Commands/display-rank";
import giveXp from "./Commands/give-xp";
import resetXp from "./Utils/resetXp"
import facModalHandler from "./Utils/facModalHandler";
import facSelectHandler from "./Utils/facSelectHandler";
import setFacChannel from "./Commands/set-fac-channel";
import facClose from "./Commands/fac-close";


require("dotenv").config();
const host = process.env.APP_HOST ? process.env.APP_HOST : "0.0.0.0";
const currentVersion = 30;
const commandMapping: any = {
  sphelp: { sub: false, vars: 1, handler: sphelp },
  spcode: {
    sub: true,
    handler: {
      add: { func: spaddcode, vars: 2 },
      remove: { func: spremovecode, vars: 2 },
    },
  },
  sploc: {
    sub: true,
    handler: {
      add: { func: spaddloc, vars: 2 },
      remove: { func: spremoveloc, vars: 2 },
      list: { func: splistloc, vars: 1 },
    },
  },
  spprettyname: {
    sub: true,
    handler: {
      add: { func: spaddprettyname, vars: 2 },
      remove: { func: spremoveprettyname, vars: 2 },
    },
  },
  sptarget: {
    sub: true,
    handler: {
      set: { func: spsettarget, vars: 2 },
      remove: { func: spremovetarget, vars: 2 },
    },
  },
  splogichannel: {
    sub: true,
    handler: {
      set: { func: spsetlogichannel, vars: 2 },
      remove: { func: spremovelogichannel, vars: 2 },
    },
  },
  sprole: { sub: false, vars: 1, handler: sprole },
  spnotif: { sub: false, vars: 1, handler: spnotif },
  spstockpile: {
    sub: true,
    handler: {
      add: { func: spaddstockpile, vars: 2 },
      remove: { func: spremovestockpile, vars: 2 },
      purge: { func: sppurgestockpile, vars: 2 },
    },
  },
  spdisabletime: { sub: false, vars: 2, handler: spdisabletime },
  spfind: { sub: false, vars: 1, handler: spfind },
  spitems: { sub: false, vars: 1, handler: spitems },
  sprefresh: { sub: false, vars: 1, handler: sprefresh },
  spsetamount: { sub: false, vars: 2, handler: spsetamount },
  spstatus: { sub: false, vars: 1, handler: spstatus },
  spsetpassword: { sub: false, vars: 1, handler: spsetpassword },
  spsettimeleft: { sub: false, vars: 2, handler: spsettimeleft },
  spgroup: { sub: false, vars: 2, handler: spgroup },
  spuser: { sub: false, vars: 1, handler: spuser },
  spaddfacility: { sub: false, vars: 2, handler: spaddfacility },
  spsetmsupp: { sub: false, vars: 1, handler: spsetmsupp },
  spmsuppcons: { sub: false, vars: 2, handler: spmsuppcons },
  spremovefac: { sub: false, vars: 2, handler: spremovefac },
  "set-logi-ticket-channel": { sub: false, vars: 1, handler: setLogiTicketChannel },
  'set-active-role': { sub: false, vars: 1, handler: setActiveRole },
  'set-inactive-role': { sub: false, vars: 1, handler: setInactiveRole },
  'enlist': { sub: false, vars: 1, handler: enlist },
  'create-logistics-ticket': { sub: false, vars: 1, handler: createLogisticsTicket },
  'lb-add': { sub: false, vars: 1, handler: lbAdd },
  'deliver': { sub: false, vars: 1, handler: deliver },
  'lb-remove': { sub: false, vars: 1, handler: lbRemove },
  'lb-view': { sub: false, vars: 1, handler: lbView },
  'lb-discard': { sub: false, vars: 1, handler: lbDiscard },
  'lb-complete': { sub: false, vars: 1, handler: lbComplete },
  'create-forum-channel': { sub: false, vars: 1, handler: createForumChannel },
  'set-bot-channel-cat': { sub: false, vars: 1, handler: setBotChannelCat },
  'set-rank-roles': { sub: false, vars: 1, handler:  setRankRoles},
  'rank': { sub: false, vars: 1, handler: rank },
  'display-rank': { sub: false, vars: 1, handler: displayRank },
  'give-xp': { sub: false, vars: 1, handler: giveXp },
  'set-fac-channel': { sub: false, vars: 1, handler: setFacChannel },
  'fac-close': { sub: false, vars: 1, handler: facClose },
};
const timerBP = [60 * 5, 60 * 10, 60 * 30, 60 * 60, 60 * 60 * 6, 60 * 60 * 12]; // Timer breakpoints in seconds

declare global {
  var NodeCacheObj: NodeCache;
}

const updateFirstTimeSetup = async (newInstance: boolean): Promise<void> => {
  // Run first-time setup
  const collections = getCollections();
  insertCommands();

  if (newInstance) {
    const password = crypto.randomBytes(32).toString("hex");
    console.info(
      "Generated a random password since none was previously set: " +
        password +
        ". You can change this using /spsetpassword via the bot",
    );
    await collections.config.insertOne({
      version: currentVersion,
      password: await argon2.hash(password),
    });
    console.log("Completed first-time setup");
  } else {
    await collections.config.updateOne(
      {},
      { $set: { version: currentVersion } },
    );
    console.info("Completed Storeman Bot update");
  }
};

const createCacheStartup = async (client: Client) => {

  // Create list of timeLefts till the stockpile expires
  const collections = getCollections();

  const stockpiles = await collections.stockpiles.find({}).toArray();
  let stockpileTime: any = {};
  for (let i = 0; i < stockpiles.length; i++) {
    if ("expireDate" in stockpiles[i]) {
      let nextBreakPointIndex = timerBP.length - 1;
      
      for (let x = 0; x < timerBP.length; x++) {
        const ExpireDate: any = stockpiles[i].expireDate;
        const currentDate: any = new Date();
        if ((ExpireDate - currentDate) / 1000 <= timerBP[x]) {
          nextBreakPointIndex = x;
          break;
        }
      }
      if (nextBreakPointIndex >= 1) nextBreakPointIndex --;
      stockpileTime[stockpiles[i].name] = {
        expireDate: stockpiles[i].expireDate,
        nextBreakPointIndex: nextBreakPointIndex,
      };
    }
    if ("prettyName" in stockpiles[i] && stockpileTime[stockpiles[i].name]) {
      const cleanedPrettyName = stockpiles[i].prettyName.replace(/\./g, "").replace(/\$/g, "")
      stockpileTime[stockpiles[i].name]["prettyName"] = cleanedPrettyName
    }
  }

  const facilites = await collections.facilities.find({}).toArray();
  let msuppsLeft: any = {};

  for (let i = 0; i < facilites.length; i++) {
    if ("expireDate" in facilites[i]) {
      let nextBreakPointIndex = timerBP.length - 1;
      for (let x = 0; x < timerBP.length; x++) {
        const expireDate: any = facilites[i].expireDate;
        const currentDate: any = new Date();
        if ((expireDate - currentDate) / 1000 <= timerBP[x]) {
          nextBreakPointIndex = x;
          break;
        }
      }
      if (nextBreakPointIndex >= 1) nextBreakPointIndex--;
      msuppsLeft[facilites[i].name] = {
        expireDate: facilites[i].expireDate,
        nextBreakPointIndex: nextBreakPointIndex,
      };
    }
  }

  NodeCacheObj.set("stockpileTimes", stockpileTime);
  NodeCacheObj.set("msuppsLeft", msuppsLeft);
  NodeCacheObj.set("stockpileMsgs", {});

  // Check whether to insert commands and do first-time setup
  if (process.env.NODE_ENV === "development") insertCommands();

  const configOptions = await collections.config.findOne({},)  ;

  if (configOptions) {
    let notifRoles = [];
    if ("notifRoles" in configOptions) notifRoles = configOptions.notifRoles;
    NodeCacheObj.set("notifRoles", notifRoles);

    let disableTimeNotif: any = false;
    if ("disableTimeNotif" in configOptions)
      disableTimeNotif = configOptions.disableTimeNotif;
    NodeCacheObj.set("disableTimeNotif", disableTimeNotif);

    let stockpileGroups: any = {};
    if ("stockpileGroups" in configOptions)
      stockpileGroups = configOptions.stockpileGroups;
    NodeCacheObj.set("stockpileGroups", stockpileGroups);

    if (configOptions.version) {
      if (configOptions.version < currentVersion) {
        updateFirstTimeSetup(false);
      }
    } else updateFirstTimeSetup(true);
  } else updateFirstTimeSetup(true);
};

const main = async (): Promise<void> => {
  let commandCallQueue: Array<Interaction> = [];
  let multiServerCommandQueue: any = {};

  const handleCommand = async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        const commandMapResult = commandMapping[commandName];
        if (!commandMapResult) {
          await interaction.editReply({
            content:
              "This command has been removed. Discord might not have invalidated this old command ;c",
          });
          return false;
        }
        if (commandMapResult.sub) {
          const subMapResult =
            commandMapResult.handler[interaction.options.getSubcommand()];
          if (subMapResult.vars === 2)
            await subMapResult.func(interaction, client);
          else await subMapResult.func(interaction);
        } else {
          if (commandMapResult.vars === 2)
            await commandMapResult.handler(interaction, client);
          else await commandMapResult.handler(interaction);
        }
      } else if (interaction.isButton()) {
        await buttonHandler(interaction);

      } else if ((interaction as any).isStringSelectMenu && (interaction as any).isStringSelectMenu()) {
        await facSelectHandler(interaction as any);
      } else if (interaction.isModalSubmit()) {
          await facModalHandler(interaction);
      } else if (interaction.isAutocomplete()) {
        await autoCompleteHandler(interaction);
      }
    } catch (e) {
      if (interaction.isChatInputCommand() || interaction.isButton()  || interaction.isModalSubmit()) {
        let errorDump = JSON.stringify(e, Object.getOwnPropertyNames(e));
        if (interaction.isChatInputCommand()) {
          console.log(
            "[!!!]: An error has occured in the command " +
              interaction.commandName +
              ". Please kindly report this to the developer on Discord (pabelpanator)",
          );
          interaction.followUp({
            content:
              "[❗❗❗] An error has occurred in Storeman Bot for the command `" +
              interaction.commandName +
              "`. Please kindly send the logs below this message to the developer on Discord at pabelpanator",
            ephemeral: true,
          });
        } else if (interaction.isButton()) {
          console.log(
            "[!!!]: An error has occured in a button action. Please kindly report this to the developer on Discord (pabelpanator)",
          );
          interaction.followUp({
            content:
              "[❗❗❗] An error has occurred in Storeman Bot button action. Please kindly send logs below this message to the developer on Discord at pabelpanator.",
            ephemeral: true,
          });
        } else if (interaction.isModalSubmit()) {
            console.log(
              "[!!!]: An error has occured in a modal submission. Please kindly report this to the developer on Discord (pabelpanator)",
            );
            interaction.followUp({
              content:
                "[❗❗❗] An error has occurred in Storeman Bot modal submission. Please kindly send logs below this message to the developer on Discord at pabelpanator.",
              ephemeral: true,
            });
        }
        while (errorDump.length > 0) {
          if (errorDump.length > 2000) {
            const sliced = errorDump.slice(0, 2000);
            const lastEnd = sliced.lastIndexOf("\n");
            const finalMsg = sliced.slice(0, lastEnd);

            await interaction.followUp({
              content: finalMsg,
              ephemeral: true,
            });
            errorDump = errorDump.slice(lastEnd, errorDump.length);
          } else {
            await interaction.followUp({
              content: errorDump,
              ephemeral: true,
            });
            errorDump = "";
          }
        }
      }
    }

    
    commandCallQueue.splice(0, 1);
    if (commandCallQueue.length > 0) {
      handleCommand(commandCallQueue[0]);
    }
    console.log(
      "[Command Queue:] Finished 1 command. Remaining length of queue: " +
        commandCallQueue.length,
    );
  };

  // Create a new client instance
  const client = new Client({ intents: [
    // GatewayIntentBits.Guilds,
    IntentsBitField.Flags.Guilds, 
    IntentsBitField.Flags.GuildMessages, 
    IntentsBitField.Flags.GuildMembers, 
    IntentsBitField.Flags.GuildModeration,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildMessageTyping,
    IntentsBitField.Flags.DirectMessages] });
  global.NodeCacheObj = new NodeCache({ checkperiod: 0, useClones: false });

  let subCategories: any = {};
  for (let i=0; i<categories.length;i++){
    let index = categories[i]
    subCategories[index]=new Array()
  }
  const csvData: Array<any> = await new Promise(function (resolve, reject) {
    let fetchData: any = [];
    fs.createReadStream("ItemNumbering.csv")
      //@ts-ignore
      .pipe(csv())
      .on("data", (row) => {
        fetchData.push(row);
      })
      .on("end", () => {
        console.log("Item List CSV file successfully processed");
        resolve(fetchData);
      })
      .on("error", reject);
  });
  let itemList: String[] = [];
  let listWithCrates: String[] = [];
  let itemListBoth: String[] = [];
  let lowerToOriginal: any = {};
  let itemListCategoryMapping: any = {};
  let specialCrates: any = {};
  

  for (let i = 0; i < csvData.length; i++) {
    const loweredName = csvData[i].Name.slice()
      .replace(/\./g, "_")
      .toLowerCase();
    itemList.push(loweredName);
    listWithCrates.push(loweredName + " crate");
    itemListBoth.push(loweredName);
    itemListBoth.push(loweredName + " crate");
    lowerToOriginal[loweredName] = csvData[i].Name;
    lowerToOriginal[loweredName + " crate"] = csvData[i].Name + " crate";

    if (csvData[i].StockpileCategory === "Vehicle" || csvData[i].StockpileCategory === "Shippable") {
      itemListCategoryMapping[loweredName] = csvData[i].StockpileCategory;
      itemListCategoryMapping[loweredName + " crate"] =
        csvData[i].StockpileCategory + " Crate";
      if (csvData[i].CrateExists){
        specialCrates[loweredName] = csvData[i].perCrate
      }
    } else {
      itemListCategoryMapping[loweredName] = csvData[i].StockpileCategory;
      itemListCategoryMapping[loweredName + " crate"] = csvData[i].StockpileCategory;
      
    }

    let catArray = subCategories[csvData[i].CustomCategory]
    if (catArray){
      catArray.push(loweredName)
    }
  }

  const LocationCSV: Array<any> = await new Promise(function (resolve, reject) {
    let fetchData: any = [];
    fs.createReadStream("Locs.csv")
      //@ts-ignore
      .pipe(csv())
      .on("data", (row) => {
        fetchData.push(row);
      })
      .on("end", () => {
        console.log("Location CSV file successfully processed");
        resolve(fetchData);
      })
      .on("error", reject);
  });
  let locationMappings: any = {};
  for (let i = 0; i < LocationCSV.length; i++) {
    locationMappings[LocationCSV[i].Code.toLowerCase()] =
      LocationCSV[i].Translation;
  }

  NodeCacheObj.set("itemList", itemList);
  NodeCacheObj.set("itemListBoth", itemListBoth);
  NodeCacheObj.set("listWithCrates", listWithCrates);
  NodeCacheObj.set("lowerToOriginal", lowerToOriginal);
  NodeCacheObj.set("itemListCategoryMapping", itemListCategoryMapping);
  NodeCacheObj.set("locationMappings", locationMappings);
  NodeCacheObj.set("subCategories", subCategories);
  NodeCacheObj.set("specialCrates", specialCrates);

  NodeCacheObj.set("timerBP", timerBP);

  // Connect to mongoDB
  if (await open()) {
    setInterval(checkTimeNotifs, 1000 * 60, client, false, true);
    setInterval(resetXp, 1000 * 60*60*24);

    // Start HTTP server
    const server = http.createServer((request, response) => {
      if (request.method === "POST") {
        let body = "";
        request.on("data", (data) => {
          body += data;
        });
        request.on("end", async () => {
          try {
            await stockpilerUpdateStockpile(client, JSON.parse(body), response);
          } catch (e) {
            response.writeHead(403, { "Content-Type": "application/json" });
            response.end(
              JSON.stringify({ success: false, error: "invalid-json" }),
            );
          }
        });
      } else if (request.method === "GET") {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.write(`
                    <html>
                        <h1>Storeman Bot - ${VERSION} (${UPDATE_DATE})</h1>
                        <p>If you are seeing this page, it means you have reached the Storeman Bot sanity check web page. Please use the <a href="https://github.com/tehruttiger/Stockpiler">Stockpiler</a> app to communicate with our servers instead!</p>
                    </html>
                `);
        response.end();
      }
    });

    server.listen(parseInt(process.env.APP_PORT!), host);
    console.log(
      `HTTP server now listening at http://${host}:${process.env.APP_PORT}`,
    );

    // This is called once client(the bot) is ready
    client.once("ready", async () => {
      await createCacheStartup(client);
      console.log("Storeman Bot is ready!");
      client.user?.setActivity("/sphelp");
    });

    client.on("messageCreate", messageListener);

    client.on("interactionCreate", async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await interaction.reply({
          content: "Working on it...",
          ephemeral: true,
        });
      }

      commandCallQueue.push(interaction);
      if (commandCallQueue.length === 1) {
        console.log("[Command Queue:] No queue ahead, starting.");
        handleCommand(commandCallQueue[0]);
        // kick start the queue
      }

    });

    // Connect by logging into Discord
    client.login(process.env.STOCKPILER_TOKEN);
  } else {
    console.error("Failed to connect to MongoDB. Exiting now");
  }
};

main();
