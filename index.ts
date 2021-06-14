/* Discord Chatter Main File
 * This is a plugin for BDSX
 * All code within this project is under the ISC License.
 * Copyright (c) 2021, TheShadowEevee and Github Contributors (https://github.com/TheShadowEevee/BDSX-Discord-Chatter-Plugin)
 * See the LICENSE file for more.
*/

// JSON Files
import { version as currVersion } from "./package.json";

const fs = require('fs');
const path = require('path');

// Create config json if it doesn't exist
if (!fs.existsSync("./configs/Discord-Chatter/config.json") ) {
    const defaultConfig = {
        "token": "null",
        "chanID": "null",
        "BotEnabled": true,
        "PostDiscordMessagesToConsole": false,
        "EnableJoinLeaveMessages": true,
        "EnableServerStartStopMessages": true
    }
    const jsonString = JSON.parse(JSON.stringify(defaultConfig));
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
    fs.writeFileSync("./configs/Discord-Chatter/config.json", JSON.stringify(jsonString, null, 2), (err: any) => {
        if (err) {
            console.log("[DiscordChatter] Error creating default config.json file" + err)
        } else {
            console.log("[DiscordChatter] Created a default config.json file.")
            console.log("[DiscordChatter] Please set your configuration values!");
            console.log("[DiscordChatter] Run `dc config help` in the console for more info.");
        }
    });
}

// BDSX Imports
import { bedrockServer, MinecraftPacketIds, command } from 'bdsx';
import { events } from "bdsx/event";
import { CxxString } from "bdsx/nativetype";

// Discord Bot Requirements
const Discord = require('discord.js');
var bot = new Discord.Client({ disableEveryone: true });

console.log("[DiscordChatter] Starting DiscordChatter!");
console.log(`[DiscordChatter] DiscordChatter is version ${currVersion}.`);
if ( GetConfig("BotEnabled")  == true ) {
    bot.login(GetConfig("token")).catch((e: string) => {
        if (e == "Error: An invalid token was provided." || e == "Error: Incorrect login details were provided.") {
            console.log("\n[DiscordChatter] Error in Discord.js: Invalid Login Token.");
            console.log("[DiscordChatter] You have provided an Invalid Login Token; Please run `dc config token {token}` in the console.");
            console.log("[DiscordChatter] DiscordChatter will not work without a proper token.\n");
        } else {
            console.log("[DiscordChatter] Uncaught Error! Please report this.");
            throw e;
        }
    });
}

// Bot Events
// Events related to discord.js

bot.on('ready', () => {
    console.info(`[DiscordChatter] Logged in as ${bot.user.tag}!`);
    console.info("[DiscordChatter] DiscordChatter has started.");

    if ( GetConfig("EnableServerStartStopMessages")  == true ) {
        SendToDiscord("Server Started!", "Server");
    }
    bot.user.setPresence({ activity: { name: 'Listening for chatter!' }, status: 'online' });
});

bot.on('message', (msg: { channel: { id: string; }; author: { bot: string | boolean; username: string; }; content: string; }) => {
    if (msg.channel.id == GetConfig("chanID") && msg.author.bot != true) {
        SendToGame(msg.content, msg.author.username);
    }
});



// BDSX Events
// These are BDS defined events that should be tracked or a message should be sent on.

// Player Join
events.serverLog.on(ev => {
    let playerJoinRegex = /^\[INFO] Player connected: [a-zA-Z0-9]+, xuid: [0-9]+$/i;
    let playerLeaveRegex = /^\[INFO] Player disconnected: [a-zA-Z0-9]+, xuid: [0-9]+$/i;

    if ( GetConfig("EnableJoinLeaveMessages") == true ) {
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
    if ( GetConfig("EnableServerStartStopMessages")  == true ) {
        SendToDiscord("Server Shutting Down!", "Server");
        console.log('[DiscordChatter] Shutting Down.');
    }
    bot.destroy(); // Node doesn't shutdown w/o this; It just freezes
});



// Message Functions
// These functions facilitate communication between Discord and the Server.

function SendToDiscord(message: string, user: string) {
    if ( GetConfig("BotEnabled") == true ) {
        const chan = bot.channels.get(GetConfig("chanID"));
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
    if ( GetConfig("BotEnabled") == true ) {
        const chan = bot.channels.get( GetConfig("chanID") );
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
    if ( GetConfig("PostDiscordMessagesToConsole") == true ) { console.log("[" + timestamp + " CHAT] <[DISCORD] " + user + "> " + message) };
};

function ReloadBot() {
    if ( GetConfig("BotEnabled") == true ) {

        console.log("[DiscordChatter] Restarting DiscordChatter!");
        console.log(`[DiscordChatter] DiscordChatter is version ${currVersion}.`);
        bot.destroy().then(() => bot.login(GetConfig("token")).catch((e: string) => {
            if (e == "Error: An invalid token was provided." || e == "Error: Incorrect login details were provided.") {
                console.log("\n[DiscordChatter] Error in Discord.js: Invalid Login Token.");
                console.log("[DiscordChatter] You have provided an Invalid Login Token; Please run `dc config token {token}` in the console.");
                console.log("[DiscordChatter] DiscordChatter will not work without a proper token.\n");
            } else {
                console.log("[DiscordChatter] Uncaught Error! Please report this.");
                throw e;
            }
        }));
    } else {
        let disabled = new Error("Bot is disabled!");
        throw disabled;
    }
}

function GetConfig(key: any) {
    const configPath = path.resolve(__dirname, process.cwd() + "/configs/Discord-Chatter/config.json");
    const config = require(configPath);

    switch (key) {
        case "token":
            return config.token;
        case "chanID":
            return config.chanID;
        case "BotEnabled":
            return config.BotEnabled;
        case "PostDiscordMessagesToConsole":
            return config.PostDiscordMessagesToConsole;
        case "EnableJoinLeaveMessages":
            return config.EnableJoinLeaveMessages;
        case "EnableServerStartStopMessages":
            return config.EnableServerStartStopMessages;
        default:
            return null;
    }
}

function UpdateConfig(key: string, value: string | boolean | undefined) {
    var defaultConfig = {
        "token": "null",
        "chanID": "null",
        "BotEnabled": true,
        "PostDiscordMessagesToConsole": false,
        "EnableJoinLeaveMessages": true,
        "EnableServerStartStopMessages": true
    }
    if (!fs.existsSync("./configs/Discord-Chatter/config.json") ) {
        var jsonString = JSON.parse(JSON.stringify(defaultConfig));
        jsonString[key] = value;
        fs.writeFileSync("./configs/Discord-Chatter/config.json", JSON.stringify(jsonString, null, 2), (err: any) => {
            if (err) {
                console.log("[DiscordChatter] Error creating default config.json file" + err)
                return 1;
            } else {
                console.log("[DiscordChatter] Created a default config.json file.")
                console.log("[DiscordChatter] Please set your configuration values!");
                console.log("[DiscordChatter] Run `dc config help` in the console for more info.");
                return 1;
            }
        });
        return 0;
    } else {
        var config = require(process.cwd() + "/configs/Discord-Chatter/config.json");

        switch (key) {
            case "token":
                config.token = value;
                break;

            case "chanID":
                config.chanID = value;
                break;

            case "BotEnabled":
                if ( value == "true" ) {
                    config.BotEnabled = true;
                    break;
                } else if (value == "false" ) {
                    config.BotEnabled = false;
                    break;
                }
                return 1;

            case "PostDiscordMessagesToConsole":
                if ( value == "true" ) {
                    config.PostDiscordMessagesToConsole = true;
                    break;
                } else if (value == "false" ) {
                    config.PostDiscordMessagesToConsole = false;
                    break;
                }
                return 1;

            case "EnableJoinLeaveMessages":
                if ( value == "true" ) {
                    config.EnableJoinLeaveMessages = true;
                    break;
                } else if (value == "false" ) {
                    config.EnableJoinLeaveMessages = false;
                    break;
                }
                return 1;

            case "EnableServerStartStopMessages":
                if ( value == "true" ) {
                    config.EnableServerStartStopMessages = true;
                    break;
                } else if (value == "false" ) {
                    config.EnableServerStartStopMessages = false;
                    break;
                }
                return 1;

            default:
                return 1;
        }

        fs.writeFileSync("./configs/Discord-Chatter/config.json", JSON.stringify(config, null, 2), (err: any) => {
            if (err) {
                console.log("[DiscordChatter] Error writing to config.json file" + err)
                return 1;
            }
        });
        return 0;
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
                tellRaw(playerName, "§4Please note that most commands require OP.§r");
                return;

            case "config":
                switch (param.second) {
                    case "token":
                        if ( playerName == "Server" ) { // This should be safe as the odds of a player named "Server" AND being an OP are almost 0.
                            UpdateConfig("token", param.third);
                            tellRaw(playerName, "Token Updated; Run `dc reload` to log in.");
                            return;
                        }
                        tellRaw(playerName, "Tokens can only be updated via the server console.");

                    case "chanID":
                        var chanID = param.third?.replace("chanID_", "");
                        UpdateConfig("chanID", chanID);
                        tellRaw(playerName, `\"chanID\" set to \"§b${chanID}§r\"`);
                        return;

                    case "BotEnabled":
                        if ( UpdateConfig("BotEnabled", param.third) == 0 ) {
                            tellRaw(playerName, `\"BotEnabled\" set to \"§a${param.third}§r\"`);
                        } else {
                            tellRaw(playerName, `Invalid value \"${param.third}\". Use \"dc config help\" for more info.`);
                        }
                        return;

                    case "PostDiscordMessagesToConsole":
                        if ( UpdateConfig("PostDiscordMessagesToConsole", param.third) == 0 ) {
                            tellRaw(playerName, `\"PostDiscordMessagesToConsole\" set to \"§a${param.third}§r\"`);
                        } else {
                            tellRaw(playerName, `Invalid value \"${param.third}\". Use \"dc config help\" for more info.`);
                        }
                        return;

                    case "EnableJoinLeaveMessages":
                        if ( UpdateConfig("EnableJoinLeaveMessages", param.third) == 0 ) {
                            tellRaw(playerName, `\"EnableJoinLeaveMessages\" set to \"§a${param.third}§r\"`);
                        } else {
                            tellRaw(playerName, `Invalid value \"${param.third}\". Use \"dc config help\" for more info.`);
                        }
                        return;

                    case "EnableServerStartStopMessages":
                        if ( UpdateConfig("EnableServerStartStopMessages", param.third) == 0 ) {
                            tellRaw(playerName, `\"EnableServerStartStopMessages\" set to \"§a${param.third}§r\"`);
                        } else {
                            tellRaw(playerName, `Invalid value \"${param.third}\". Use \"dc config help\" for more info.`);
                        }
                        return;

                    case "help":
                        tellRaw(playerName, "§3----- DiscordChatter Config Help -----§r")
                        tellRaw(playerName, "/dc config {Key} {Value} - Set a config value (Case-Sensitive)")
                        tellRaw(playerName, "A list of keys can be found at https://github.com/TheShadowEevee/BDSX-Discord-Chatter-Plugin#readme")
                        tellRaw(playerName, "Instructions on how to get some values can be found there as well.")
                        tellRaw(playerName, "")
                        tellRaw(playerName, "§4Please note that most commands require OP.§r");
                        tellRaw(playerName, "§4You MUST be using the server console to modify the bot token.§r");
                        return;

                    default:
                        tellRaw(playerName, `Invalid argument \"${param.second}\". Use \"dc config help\" for more info.`);
                        return;
                }

            case "reload":
                tellRaw(playerName, "Reloading DiscordChatter!");
                try {
                    ReloadBot();
                } catch (e) {
                    if (e == "Error: Bot is disabled!") {
                        tellRaw(playerName, "DiscordChatter is disabled. Stopping the reload.");
                    } else {
                        throw e;
                    }
                }
                return;

            default:
                tellRaw(playerName, `Invalid argument \"${param.first}\". Use \"dc help\" for a list of commands.`);
                return;
        }
    }, {
            first: [CxxString, true], // Help, Config, Reload, Other
            second: [CxxString, true], // Config Types
            third: [CxxString, true] // New Config Values
    });
});
