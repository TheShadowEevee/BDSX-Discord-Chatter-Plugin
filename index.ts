/* Discord Chatter Main File
 * This is a plugin for BDSX
 * All code within this project is under the ISC License.
 * Copyright (c) 2021, TheShadowEevee and Github Contributors (https://github.com/TheShadowEevee/BDSX-Discord-Chatter-Plugin)
 * See the LICENSE file for more.
*/

// JSON Files
import { version as currVersion } from "./package.json";
// Create config json if it doesn't exist
const fs = require('fs')
if (!fs.existsSync("./configs/Discord-Chatter/config.json") ) {
    const defaultConfig = {
        "token": "null",
        "chanID": "null",
        "BotEnabled": true,
        "PostDiscordMessagesToConsole": false,
        "EnableJoinLeaveMessages": true,
        "EnableServerStartStopMessages": true
    }
    const jsonString = JSON.stringify(defaultConfig)
    if (!fs.existsSync("./configs")) {
        fs.mkdir("./configs", (err: any) => {
            if (err) {
                console.log("[DiscordChatter] Error creating default config.json file" + err);
            }
        });
    };
    if (!fs.existsSync("./configs/Discord-Chatter")) {
        fs.mkdir("./configs/Discord-Chatter", (err: any) => {
            if (err) {
                console.log("[DiscordChatter] Error creating default config.json file" + err);
            }
        });
    };
    fs.writeFileSync("./configs/Discord-Chatter/config.json", jsonString, (err: any) => {
        if (err) {
            console.log("[DiscordChatter] Error creating default config.json file" + err)
        } else {
            console.log("[DiscordChatter] Created a default config.json file.")
            console.log("[DiscordChatter] Please set your configuration values!");
            console.log("[DiscordChatter] Run `dc config help` in the console for more info.");
        }
    });
}
const configFile = JSON.parse(fs.readFileSync("./configs/Discord-Chatter/config.json", "utf8"));

var enabled = configFile.BotEnabled;
var token = configFile.token;
var channel = configFile.chanID;
var postToConsole = configFile.PostDiscordMessagesToConsole;
var joinLeaveMSG = configFile.EnableJoinLeaveMessages;
var startStopMSG = configFile.EnableServerStartStopMessages;

// BDSX Imports
import { bedrockServer, MinecraftPacketIds, command } from 'bdsx';
import { events } from "bdsx/event";
import { CxxString } from "bdsx/nativetype";

// Discord Bot Requirements
const Discord = require('discord.js');
var bot = new Discord.Client({ disableEveryone: true });

console.log("[DiscordChatter] Starting DiscordChatter!");
console.log(`[DiscordChatter] DiscordChatter is version ${currVersion}.`);
if ( enabled ) {
    bot.login(token).catch((e: string) => {
        if (e == "Error: An invalid token was provided." || e == "Error: Incorrect login details were provided.") {
            console.log("\n[DiscordChatter] Error in Discord.js: Invalid Login Token.");
            console.log("[DiscordChatter] You have provided an Invalid Login Token; Please run `dc config token {token}` in the console.");
            console.log("[DiscordChatter] DiscordChatter will not work without a proper token.\n");
            enabled = false;
        } else {
            console.log("[DiscordChatter] Uncaught Error! Please report this.");
            enabled = false;
            throw e;
        }
    });
}

// Bot Events
// Events related to discord.js

bot.on('ready', () => {
    console.info(`[DiscordChatter] Logged in as ${bot.user.tag}!`);
    console.info("[DiscordChatter] DiscordChatter has started.");

    if (startStopMSG) {
        SendToDiscord("Server Started!", "Server");
    }
    bot.user.setPresence({ activity: { name: 'Listening for chatter!' }, status: 'online' });
});

bot.on('message', (msg: { channel: { id: string; }; author: { bot: string | boolean; username: string; }; content: string; }) => {
    if (msg.channel.id == channel && msg.author.bot != true) {
        SendToGame(msg.content, msg.author.username);
    }
});



// BDSX Events
// These are BDS defined events that should be tracked or a message should be sent on.

// Player Join
events.serverLog.on(ev => {
    let playerJoinRegex = /^\[INFO] Player connected: [a-zA-Z0-9]+, xuid: [0-9]+$/i;
    let playerLeaveRegex = /^\[INFO] Player disconnected: [a-zA-Z0-9]+, xuid: [0-9]+$/i;

    if ( joinLeaveMSG ) {
        // Player Join (Extract Username)
        if (playerJoinRegex.test(ev)) {
            let slice = ev.replace(/^\[INFO] Player connected: /g, '');
            SendToDiscordEvent("has joined the server!", slice.replace(/, xuid: [0-9]+/g, ''));
        };

        // Player Leave (Extract Username)
        if (playerLeaveRegex.test(ev)) {
            let slice = ev.replace(/^\[INFO] Player disconnected: /g, '');
            SendToDiscordEvent("has left the server!", slice.replace(/, xuid: [0-9]+/g, ''));
        };
    }
});

// Chat Message Sent
events.packetAfter(MinecraftPacketIds.Text).on(ev => {
    SendToDiscord(ev.message, ev.name);
});

// On Server Close
events.serverClose.on(()=>{
    if (startStopMSG) {
        SendToDiscord("Server Shutting Down!", "Server");
        console.log('[DiscordChatter] Shutting Down.');
    }
    bot.destroy(); // Node doesn't shutdown w/o this; It just freezes
});



// Message Functions
// These functions facilitate communication between Discord and the Server.

function SendToDiscord(message: string, user: string) {
    if ( enabled ) {
        const chan = bot.channels.get(channel);
        try {
            chan.send("[" + user + "] " + message).catch((e: any) => {
                if (e == "DiscordAPIError: Missing Permissions") {
                    console.log("[DiscordChatter] Error in discord.js: Missing permissions.");
                    console.log("[DiscordChatter] Ensure the bot is in your server AND it has send permissions in the relevant channel!");
                } else {
                    console.log("[DiscordChatter] Uncaught Error! Please report this.");
                    throw e;
                }
            });
        } catch (e) {
            if (e == "TypeError: Unable to get property 'send' of undefined or null reference") {
                console.log("\n[DiscordChatter] Failed to send message to the Discord Server!");
                console.log("[DiscordChatter] Either your Token is incorrect, or the Channel ID is invalid.");
                console.log("[DiscordChatter] Please double check the related values and fix them.\n");
            } else {
                console.log("[DiscordChatter] Uncaught Error! Please report this.");
                throw e;
            }
        }
    }
};

function SendToDiscordEvent(message: string, user: string) {
    if ( enabled ) {
        const chan = bot.channels.get(channel);
        try {
            chan.send(user + " " + message).catch((e: any) => {
                if (e == "DiscordAPIError: Missing Permissions") {
                    console.log("[DiscordChatter] Error in discord.js: Missing permissions.");
                    console.log("[DiscordChatter] Ensure the bot is in your server AND it has send permissions in the relevant channel!");
                } else {
                    console.log("[DiscordChatter] Uncaught Error! Please report this.");
                    throw e;
                }
            });
        } catch (e) {
            if (e == "TypeError: Unable to get property 'send' of undefined or null reference") {
                console.log("\n[DiscordChatter] Failed to send message to the Discord Server!");
                console.log("[DiscordChatter] Either your Token is incorrect, or the Channel ID is invalid.");
                console.log("[DiscordChatter] Please double check the related values and fix them.\n");
            } else {
                console.log("[DiscordChatter] Uncaught Error! Please report this.");
                throw e;
            }
        }
    }
};

function SendToGame(message: string, user: string) {

    // Timestamp
    var date_time = new Date();
    var date = ("0" + date_time.getDate()).slice(-2);
    var month = ("0" + (date_time.getMonth() + 1)).slice(-2);
    var year = date_time.getFullYear();
    var hours = ("0" + date_time.getHours()).slice(-2);
    var minutes = ("0" + date_time.getMinutes()).slice(-2);
    var seconds = ("0" + date_time.getSeconds()).slice(-2);
    // Prints YYYY-MM-DD HH:MM:SS format - Allow format changing in config!
    var timestamp = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

    // Actual Messages
    bedrockServer.executeCommand("say <§2[DISCORD]§r " + user + "> " + message, false);
    if ( postToConsole ) { console.log("[" + timestamp + " CHAT] <[DISCORD] " + user + "> " + message) };
};

function ReloadBot() {
    if ( enabled ) {
        console.log("[DiscordChatter] Stopping DiscordChatter!");
        bot.destroy();

        bot = new Discord.Client({ disableEveryone: true });

        console.log("[DiscordChatter] Starting DiscordChatter!");
        console.log(`[DiscordChatter] DiscordChatter is version ${currVersion}.`);
        bot.login(token).catch((e: string) => {
            if (e == "Error: An invalid token was provided." || e == "Error: Incorrect login details were provided.") {
                console.log("\n[DiscordChatter] Error in Discord.js: Invalid Login Token.");
                console.log("[DiscordChatter] You have provided an Invalid Login Token; Please run `dc config token {token}` in the console.");
                console.log("[DiscordChatter] DiscordChatter will not work without a proper token.\n");
            } else {
                console.log("[DiscordChatter] Uncaught Error! Please report this.");
                throw e;
            }
        });
    } else {
        let disabled = new Error("Bot is disabled!");
        throw disabled;
    }
}


// Register Commands
// These are the commands usable by players/console to control the plugin.

// On Server Open
events.serverOpen.on(()=>{
    let system = server.registerSystem(0,0);

    // Cheaty way to return output to a user
    function tellRaw(playerName: string, text: string){
        if ( playerName != "Server" ) {
            system.executeCommand(`/tellraw ${playerName} {"rawtext":[{"text":"${text}"}]}`, () => {});
        } else {
            console.log(text);
        }
    }

    // Register the "dc" Command for DiscordChatter (1 = Operator Perms Minimum Required)
    command.register('dc', 'DiscordChatter Commands', 1).overload((param, origin, output)=>{
        let playerName = origin.getName();
        switch (param.first) {
            case "help":
                tellRaw(playerName, "§3----- DiscordChatter Help -----§r")
                tellRaw(playerName, "/dc help - Shows this help text")
                tellRaw(playerName, "/dc reload - Reloads the Discord Bot")
                tellRaw(playerName, "/dc config - Used to change config options")
                tellRaw(playerName, "")
                tellRaw(playerName, "§4Please note that most commands require OP.§r")
                return 0;

            case "config":
                tellRaw(playerName, "Unimplimented.")
                return 0;

            case "reload":
                tellRaw(playerName, "Reloading DiscordChatter!")
                try {
                    ReloadBot();
                } catch (e) {
                    if (e == "Error: Bot is disabled!") {
                        tellRaw(playerName, "DiscordChatter is disabled. Stopping the reload.")
                    } else {
                        throw e;
                    }
                }
                return 0;

            default:
                tellRaw(playerName, `Invalid argument \"${param.first}\". Use \"dc help\" for a list of commands.`)
                return 0;
        }
    }, {
            first: [CxxString, true], // Help, Config, Reload, Other
            second: [CxxString, true], // Config Types
            third: [CxxString, true] // New Config Values
    });
});
