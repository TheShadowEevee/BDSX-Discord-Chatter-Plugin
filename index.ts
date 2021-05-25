
// Create config json if it doesn't exist

// BDSX Imports
import { bedrockServer, MinecraftPacketIds } from 'bdsx';
import { events } from "bdsx/event";

// JSON Files
import { version as currVersion } from "./package.json";
import { token, chanID as channel} from "./config.json";

// Discord Bot Requirements
const Discord = require('discord.js');
const bot = new Discord.Client({ disableEveryone: true });

console.log('[DiscordChatter] Starting DiscordChatter!');
console.log(`[DiscordChatter] DiscordChatter is version ${currVersion}.`);
try {
    bot.login(token);
} catch (e) {
    if (e == "Error: An invalid token was provided") {
        let error = new Error("You have provided an invalid Token!\nPlease run `dc config token {token}` in the console.");
        throw error;
    } else {
        console.log("Nope");
    }
}

// Bot Events
// Events related to discord.js

bot.on('ready', () => {
    console.info(`[DiscordChatter] Logged in as ${bot.user.tag}!`);
    console.info(`[DiscordChatter] DiscordChatter has started.`);

    SendToDiscord("Server Started!", "Server")
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
});

// Chat Message Sent
events.packetAfter(MinecraftPacketIds.Text).on(ev => {
    SendToDiscord(ev.message, ev.name);
});

// On Server Close
events.serverClose.on(()=>{
    SendToDiscord("Server Shutting Down!", "Server")
    console.log('[DiscordChatter] Shutting Down.');
    bot.destroy(); // Node doesn't shutdown w/o this; It just freezes
});



// Message Functions
// These functions facilitate communication between Discord and the Server.

function SendToDiscord(message: string, user: string) {
    const chan = bot.channels.get(channel);
    chan.send("[" + user + "] " + message).catch((e: any) => {
        if (e == "DiscordAPIError: Missing Permissions") {
            console.log("[DiscordChatter] Error in Discord.js: Missing permissions.");
            console.log("[DiscordChatter] Ensure the bot is in your server AND it has send permissions in the relevant channel!")
        } else {
            console.log("[DiscordChatter] Uncaught Error! Please report this.")
            throw e;
        }
    });
};

function SendToDiscordEvent(message: string, user: string) {
    const chan = bot.channels.get(channel);
    chan.send(user + " " + message).catch((e: any) => {
        if (e == "DiscordAPIError: Missing Permissions") {
            console.log("[DiscordChatter] Error in discord.js: Missing permissions.");
            console.log("[DiscordChatter] Ensure the bot is in your server AND it has send permissions in the relevant channel!")
        } else {
            console.log("[DiscordChatter] Uncaught Error! Please report this.")
            throw e;
        }
    });
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
    console.log("[" + timestamp + " CHAT] <[DISCORD] " + user + "> " + message)
};