
# DiscordChatter For BDS eXtended

A simple plugin that allows communication between a [BDSX enabled server](https://github.com/bdsx/bdsx) and a Discord server!  

This allows you to choose a Discord Server where various server events will be posted.
Of course, this also allows chat between the server and Discord! Any in-game messages will appear in Discord and any messages sent in the channel the plugin posts to will appear to users in-game.

## Installation

- Instructions Soon.

## Setup

- Install the plugin
- Create a new Discord Bot
  - Open <https://discord.com/developers/applications> and sign in
  - Click "New Application" and give the bot a name, then click Create
  - Click the Bot option in the sidebar
  - Click "Add Bot" then "Yes, do it!"
    - Note: If nothing happens and Discord says "Too many users have this username, please try another.", follow these steps again choosing a more unique name.
  - Give the bot a unique name
  - Copy the token. This will need to be put in the bots configuration in the next steps.
    - IMPORTANT: This token gives anyone with it access to the bot. NEVER share it publically!
    - Due to the sensitity of the token, it can only be entered via console or manually.
    - If anyone gains access to your bot regenerate this token ASAP from this screen.
- Start the server
- Run the commands in the below table to configure the bot!

## Configuration

To configure the plugin, fill in the command below with the correct information based on the table.  
Run `dc config {Option} {Input}` in the console to change the configuration

| Config Option                 | Input Type                    | Required                      | Permission Needed             |
| ----------------------------- | ----------------------------- | ----------------------------- | ----------------------------- |
| token                         | Discord Bot Token             | Yes                           | Console                       |
| chanID                        | Discord Channel ID            | Yes                           | OP                            |
| BotEnabled                    | Boolean (True/False)          | No                            | OP                            |
| PostDiscordMessagesToConsole  | Boolean (True/False)          | No                            | OP                            |
| EnableJoinLeaveMessages       | Boolean (True/False)          | No                            | OP                            |
| EnableServerStartStopMessages | Boolean (True/False)          | No                            | OP                            |

For example, to set the channel ID the bot works in, run `dc config chanID 846147660843188235` in the console.

To get a Discord Channel ID see [this Discord Help Article](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-)

## Incompatibilities

- Any plugin that modifies the user join/leave text in the console breaks related functionality in the plugin.
