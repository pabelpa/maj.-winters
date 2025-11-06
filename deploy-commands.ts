import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
require('dotenv').config();

const commands = [
    new SlashCommandBuilder().setName('sphelp').setDescription('View commands and information regarding the bot.'),
    new SlashCommandBuilder().setName('spitems').setDescription('View list of items'),
    new SlashCommandBuilder().setName('spsetamount')
        .setDescription('Sets the <amount> that an <item> has in crates inside the <stockpile>')
        .addStringOption((option) =>
            option.setName("item").setDescription("The item name").setRequired(true)
        ).addIntegerOption(option =>
            option.setName("amount").setDescription("The amount of that item").setRequired(true)
        ).addStringOption(option =>
            option.setName("stockpile").setDescription("The name of the stockpile").setRequired(true).setAutocomplete(true))
    ,
    new SlashCommandBuilder().setName('spsettimeleft')
        .setDescription('Sets the time left for a reserve <stockpile> before it expires. NOTE: <time> is a UNIX TIMESTAMP')
        .addStringOption((option) =>
            option.setName("stockpile").setDescription("The stockpile name").setRequired(true).setAutocomplete(true)
        ).addIntegerOption(option =>
            option.setName("time").setDescription("The time till the reserve stockpile expires. A Unix Timestamp.").setRequired(true))
    ,
    new SlashCommandBuilder().setName('sptarget')
        .setDescription('Command to edit the stockpile targets that the regiment (clan) should aim towards')
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Sets the target <minimum_amount> that an <item> should have in crates.")
                .addStringOption((option) =>
                    option.setName("item").setDescription("The item name").setRequired(true)
                ).addIntegerOption(option =>
                    option.setName("minimum_amount").setDescription("The minimum amount of that item").setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("maximum_amount").setDescription("The maximum amount of that item").setRequired(false)
                ).addStringOption((option) =>
                    option.setName("production_location").setDescription("The place to produce this item. Either 'MPF' or 'Factory'")
                        .addChoices({ name: "MPF", value: "MPF" }, { name: "Factory", value: "Factory" })
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes target <item> from the target goals to achieve.")
                .addStringOption((option) =>
                    option.setName("item").setDescription("The item name").setRequired(true)
                )
        ),
    new SlashCommandBuilder().setName('spstatus').setDescription('Returns the current info. Optionally filter by targets/group targets/stockpile')
        .addStringOption(
            (option) => option.setName("filter").setDescription("View a filtered version of spstatus such as viewing only targets ")
                .addChoices({ name: "Targets", value: "targets" }, { name: "Group Targets", value: "group_targets" })
                .setRequired(false)
        )
        .addStringOption((option) => option.setName("stockpile_group").setDescription("View targets for a specific <stockpile_group>").setRequired(false))
        .addStringOption((option) => option.setName("stockpile").setDescription("View items in a <stockpile> only").setRequired(false).setAutocomplete(true))
    ,
    new SlashCommandBuilder().setName('spsetpassword').setDescription('Sets the password the Stockpiler app uses to update information to the database.')
        .addStringOption((option) => option.setName("password").setDescription("The new password").setRequired(true)),
    new SlashCommandBuilder().setName('spsetorder').setDescription('Sets the order of a <stockpile> to <order> number in the list')
        .addStringOption((option) => option.setName("stockpile").setDescription("The name of the stockpile to set the order of").setRequired(true).setAutocomplete(true))
        .addIntegerOption((option) => option.setName("order").setDescription("The order number to set to (1-N), where N is the number of stockpiles in the list").setRequired(true)),
    new SlashCommandBuilder().setName('spstockpile').setDescription('Commands to manage stockpiles')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Creates an EMPTY stockpile with name <stockpile>")
                .addStringOption((option) => option.setName("stockpile").setDescription("Stockpile name").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Deletes stockpile with the name <stockpile>")
                .addStringOption((option) => option.setName("stockpile").setDescription("Stockpile name").setRequired(true).setAutocomplete(true))
        ).addSubcommand(subcommand =>
            subcommand
                .setName("purge")
                .setDescription("Deletes all stockpiles and all their information. This is a destructive and irresvesible action")
        ),
    new SlashCommandBuilder().setName('splogichannel')
        .setDescription('Logi channel settings to broadcast the stockpile status.')
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Sets the target <channel> that the logi message will be in")
                .addChannelOption(option => option.setName("channel").setDescription("The channel the message will be in").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes logi message from the set channel.")
        ),
    new SlashCommandBuilder().setName('sprole')
        .setDescription('Permission settings for roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Add <perms> to a specified <role>")
                .addStringOption(option => option.setName("perms").setDescription("Can be either 'User' or 'Admin'.")
                    .setRequired(true)
                    .addChoices({ name: "User", value: "user" }, { name: "Admin", value: "admin" })
                )
                .addRoleOption(option => option.setName("role").setDescription("The role to operate on").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove any perms from a specified <role>")
                .addRoleOption(option => option.setName("role").setDescription("The role to operate on").setRequired(true))

        ),
    new SlashCommandBuilder().setName('spuser')
        .setDescription('Permission settings for users')
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Add <perms> to a specified <user>")
                .addStringOption(option => option.setName("perms").setDescription("Can be either 'User' or 'Admin'.")
                    .setRequired(true)
                    .addChoices({ name: "User", value: "user" }, { name: "Admin", value: "admin" })
                )
                .addUserOption(option => option.setName("user").setDescription("The <user> to operate on").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove any perms from a specified <user>")
                .addUserOption(option => option.setName("user").setDescription("The role to operate on").setRequired(true))

        ),
    new SlashCommandBuilder().setName('spnotif')
        .setDescription('Stockpile expiry notification settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Adds <role> to the stockpile expiry notification list")
                .addRoleOption(option => option.setName("role").setDescription("The role to add").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove the specified <role> from the stockpile expiry notification list")
                .addRoleOption(option => option.setName("role").setDescription("The role to remove").setRequired(true))

        ),
    new SlashCommandBuilder().setName('spprettyname')
        .setDescription('Stockpile pretty name settings.')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Adds a <pretty_name> to the <stockpile>. Pretty names are alternative names")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to add a pretty name to").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("pretty_name").setDescription("The pretty name to add").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes a pretty name from the <stockpile>. Pretty names are alternative names")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to remove a pretty name from").setRequired(true).setAutocomplete(true))

        ),
    /*new SlashCommandBuilder().setName('spscan')
        .setDescription('Scan a screenshot of a stockpile')
        .addAttachmentOption(option => option.setName("screenshot").setDescription("Screenshot of the stockpile to scan").setRequired(true)),*/
    new SlashCommandBuilder().setName('spcode')
        .setDescription('Set/remove stockpile codes')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Adds a <code> to a <stockpile>")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to add a code to").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("code").setDescription("The stockpile code to add").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes a code from the <stockpile>")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to remove a code from").setRequired(true).setAutocomplete(true))

        ),
    new SlashCommandBuilder().setName('sploc')
        .setDescription('Set/remove stockpile locations or location list')
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Adds a <location> to a <stockpile>")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to add a location to").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("location").setDescription("The location to set to").setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes a location from the <stockpile>")
                .addStringOption(option => option.setName("stockpile").setDescription("The stockpile to remove a location from").setRequired(true).setAutocomplete(true))

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("List all the locations and their location codes")
        ),
    new SlashCommandBuilder().setName('spfind')
        .setDescription('Finds the <item> specified in the stockpiles')
        .addStringOption((option) =>
            option.setName("item").setDescription("The item name").setRequired(true)
        )
    ,
    new SlashCommandBuilder().setName('spdisabletime')
        .setDescription('Disables the time-check feature on Storeman Bot')
        .addBooleanOption((option) =>
            option.setName("disable").setDescription("True to disable time-check and false to enable time-check").setRequired(true)
        ),
    new SlashCommandBuilder().setName('sprefresh')
        .setDescription('Refreshes the timer of ALL stockpiles, or an individual <stockpile> if a name is provided.')
        .addStringOption((option) =>
            option.setName("stockpile").setDescription("The stockpile name").setRequired(false).setAutocomplete(true)
        ),
    new SlashCommandBuilder().setName('spgroup')
        .setDescription('Commands for creating a target list for a list of selected stockpiles')
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription("Creates a stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to create").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to remove").setRequired(true).setAutocomplete(true))

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("addstockpile")
                .setDescription("Adds the stockpile with <stockpileName> to the stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to add to").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("stockpile_name").setDescription("The name of the stockpile to add to the stockpile group").setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("removestockpile")
                .setDescription("Removes the stockpile with <stockpileName> from the stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to remove from").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("stockpile_name").setDescription("The name of the stockpile to remove from the stockpile group").setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("settarget")
                .setDescription("Sets targets for the stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to modify targets").setRequired(true).setAutocomplete(true))
                .addStringOption((option) =>
                    option.setName("item").setDescription("The item name").setRequired(true)
                ).addIntegerOption(option =>
                    option.setName("minimum_amount").setDescription("The minimum amount of that item").setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("maximum_amount").setDescription("The maximum amount of that item").setRequired(false)
                ).addStringOption((option) =>
                    option.setName("production_location").setDescription("The place to produce this item. Either 'MPF' or 'Factory'")
                        .addChoices({ name: "MPF", value: "MPF" }, { name: "Factory", value: "Factory" })
                        .setRequired(false)
                )
        ).addSubcommand(subcommand =>
            subcommand
                .setName("removetarget")
                .setDescription("Removes the target <item> from stockpile group with <name>")
                .addStringOption(option => option.setName("name").setDescription("The name of the stockpile group to remove from").setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName("item").setDescription("The name of the item to remove from targets").setRequired(true))
        ),
    new SlashCommandBuilder().setName('spaddfacility').setDescription('Adds a location that consumes msupps')
        .addStringOption((option) => option.setName("name").setDescription("The name of the facility").setRequired(true))
        .addIntegerOption((option) => option.setName("msupp").setDescription("The number of msupps this location consumes per hour").setRequired(true))
        .addIntegerOption((option) => option.setName("msupplevel").setDescription("The current number of msupps").setRequired(true)),
    new SlashCommandBuilder().setName('spsetmsupp').setDescription('sets the number of msupps supplying a facility')
        .addStringOption((option) => option.setName("name").setDescription("The name of the facility").setRequired(true).setAutocomplete(true))
        .addIntegerOption((option) => option.setName("msupp").setDescription("The number of msupps this location has").setRequired(true)),
    new SlashCommandBuilder().setName('spmsuppcons').setDescription('sets the number of msupps a facility consumes')
        .addStringOption((option) => option.setName("name").setDescription("The name of the facility").setRequired(true).setAutocomplete(true))
        .addIntegerOption((option) => option.setName("msupp").setDescription("The number of msupps this location consumes per hour").setRequired(true)),
    new SlashCommandBuilder().setName('spremovefac').setDescription('removes a facility from the msupp tracker')
        .addStringOption((option) => option.setName("name").setDescription("name of the facility").setRequired(true).setAutocomplete(true)),
    new SlashCommandBuilder().setName('set-active-role').setDescription('designates which role is active')
        .addRoleOption((option) => option.setName("role").setDescription("role associated with active members").setRequired(true)),
    new SlashCommandBuilder().setName('set-inactive-role').setDescription('designates which role is inactive')
        .addRoleOption((option) => option.setName("role").setDescription("role associated with inactive members").setRequired(true)),
    new SlashCommandBuilder().setName('enlist').setDescription('designate yourself as an active member'),
    new SlashCommandBuilder().setName('set-logi-ticket-channel').setDescription('designate a channel for logi tickets')
        .addChannelOption((option) => option.setName("channel").setDescription("channel where logi tickets live").setRequired(true))
        .addStringOption((option) => option.setName("ticket-type").setDescription("Type of logi ticket channel").setRequired(true)),
    new SlashCommandBuilder().setName('create-logistics-ticket').setDescription('create new ticket')
        .addStringOption((option) => option.setName("title").setDescription("Name of the ticket").setRequired(true))
        .addStringOption((option) => option.setName("location").setDescription("location for logi").setRequired(true))
        .addStringOption((option) => option.setName("notes").setDescription("anything additional")),
    new SlashCommandBuilder().setName('lb-add').setDescription('add demands to a your logi ticket')
        .addStringOption((option) => option.setName("resource").setDescription("resource requested").setRequired(true))
        .addIntegerOption((option) => option.setName("amount").setDescription("number of resource").setRequired(true)),
    new SlashCommandBuilder().setName('lb-view').setDescription('view the current status of you logi ticket being built'),
    new SlashCommandBuilder().setName('lb-remove').setDescription('remove demands to a your logi ticket')
        .addStringOption((option) => option.setName("resource").setDescription("resource requested").setRequired(true))
        .addIntegerOption((option) => option.setName("amount").setDescription("number of resource")),
    new SlashCommandBuilder().setName('lb-discard').setDescription('gets rid of your logi ticket being built'),
    new SlashCommandBuilder().setName('lb-complete').setDescription('finishes the construction of your logi ticket and lets people work on it'),
    new SlashCommandBuilder().setName('deliver').setDescription('marks contributions to a logi ticket')
        .addStringOption((option) => option.setName("resource").setDescription("resource requested").setRequired(true).setAutocomplete(true))
        .addIntegerOption((option) => option.setName("amount").setDescription("number of resource").setRequired(true)),
    new SlashCommandBuilder().setName('create-forum-channel').setDescription('makes a "forum" type channel with the specified name')
        .addStringOption((option) => option.setName("channel-name").setDescription("name of channel").setRequired(true)),
    new SlashCommandBuilder().setName('set-bot-channel-cat').setDescription('designates a channel category for bot things')
        .addChannelOption((option) => option.setName("channel-category").setDescription("name of channel category").setRequired(true)),
    new SlashCommandBuilder().setName('set-rank-roles').setDescription('Associates a role with a rank the bot recognizes')
        .addRoleOption((option) => option.setName("role").setDescription("role name").setRequired(true))
        .addStringOption((option) => option.setName("rank").setDescription("rank name").setRequired(true).setAutocomplete(true)),
    new SlashCommandBuilder().setName('rank').setDescription('gives you information on your rank')
        .addUserOption((option) => option.setName("soldier").setDescription("who's rank do you want to see if not your own?").setRequired(false)),
    new SlashCommandBuilder().setName('display-rank').setDescription('controls whether your rank is visible in your name')
        .addBooleanOption((option) => option.setName("show").setDescription("show or hide").setRequired(true))
        .addStringOption((option) => option.setName("in-game-name").setDescription("save your in-game name to properly construct rank").setRequired(true)),
    new SlashCommandBuilder().setName('give-xp').setDescription('gives experience to your subordinates')
        .addUserOption((option) => option.setName("soldier").setDescription("who are you giving xp to?").setRequired(true))
        .addNumberOption((option) => option.setName("xp").setDescription("amount of xp").setRequired(true))
        .addStringOption((option) => option.setName("type").setDescription("combat, logi, or engineering XP").setRequired(true).setAutocomplete(true)),
    new SlashCommandBuilder().setName('set-fac-channel').setDescription('Set the channel for FAC management')
        .addChannelOption((option) => option.setName("channel")
            .setDescription("The channel where FAC management will take place")
            .setRequired(true)),
    new SlashCommandBuilder().setName('fac-close').setDescription('Close a FAC thread') 
].map(command => command.toJSON())


const rest = new REST({ version: '10' }).setToken(<string>process.env.STOCKPILER_TOKEN);


const insertCommands = async (guild_id?: string) => {

    if (guild_id) {
        await rest.put(Routes.applicationGuildCommands(<string>process.env.STOCKPILER_CLIENT_ID, <string>guild_id), { body: commands })
            .then(() => console.log('Successfully registered application commands to guild with ID: ' + guild_id))
            .catch(console.error);
    }
    else {
        // Guild based commands for development
        // ClientId is the bot "Copy ID"
        // GuildId is the server "Copy ID"
        if (process.env.STOCKPILER_GUILD_ID && process.env.STOCKPILER_GUILD_ID !== "") {
            await rest.put(Routes.applicationGuildCommands(<string>process.env.STOCKPILER_CLIENT_ID, <string>process.env.STOCKPILER_GUILD_ID), { body: commands })
                .then(() => console.log('Successfully registered application commands to guild.'))
                .catch(console.error);
        }
        // Global commands for deployment (Global commands take at least 1 hour to update after each change)
        else {
            await rest.put(
                Routes.applicationCommands(<string>process.env.STOCKPILER_CLIENT_ID),
                { body: commands },
            ).then(() => console.log('Successfully registered application commands globally.'))
                .catch(console.error);
        }
    }

}

export { insertCommands }
