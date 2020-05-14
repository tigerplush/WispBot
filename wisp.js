const fs = require('fs');

if(!fs.existsSync('./config.json'))
{
    const defaultConfig = require('./defaultConfig.json');
    fs.writeFileSync('./config.json', JSON.stringify(defaultConfig));
}

const Discord = require('discord.js');
const auth = require('./auth.json');
const {prefix} = require('./config.json');

const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const cron = require('node-cron');

const Giveaway = require('./Giveaway.js');

const giveawayManager = new Giveaway(bot.channels);

cron.schedule("*/1 * * * *", function()
{
    giveawayManager.check();
});

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    bot.commands.set(command.name, command);
}

bot.on('messageReactionAdd', (messageReaction, user) =>
{
    if(user.bot)
    {
        return;
    }

    const message = messageReaction.message;
    if(messageReaction === message.reactions.cache.first())
    {
        const giveaway =
        {
            serverId: message.guild.id,
            messageId: message.id
        }
        giveawayManager.enter(giveaway, user);
    }
});

bot.on('messageReactionRemove', (messageReaction, user) =>
{
    if(user.bot)
    {
        return;
    }

    const message = messageReaction.message;
    if(messageReaction === message.reactions.cache.first())
    {
        const giveaway =
        {
            serverId: message.guild.id,
            messageId: message.id
        }
        giveawayManager.leave(giveaway, user);
    }
});

bot.on('ready', () => {
});

bot.on('message', message => {
    if(message.content.startsWith(prefix) && !message.author.bot)
    {
        const args = message.content.slice(prefix.length).split(/ +/);
	    const command = args.shift().toLowerCase();

        if (!bot.commands.has(command))
        {
            return;
        }

        try
        {
            bot.commands.get(command).execute(message, args);
        } catch (error)
        {
            console.error(error);
            message.reply('There was an error trying to execute that command!');
        }
    }
    
});

bot.login(auth.token)
.catch(err => console.log(err));
