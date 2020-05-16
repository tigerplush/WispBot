const moment = require('moment');
const Giveaway = require('../Giveaway.js');
const {waitingTimeString, defaultReactEmoji, customReactEmoji} = require('../config.json');

const {giveawayDb} = require('../Database/databases.js');

module.exports =
{
    name: "create",
    hidden: false,
    usage: "",
    description: "Creates a new giveaway. Wisp will dm you to get some informations. Giveaway winners must be a number greater or equal to 1. Giveaway time can be in `hh:mm:ss` or `days hh:mm:ss`",
    example:
    [
        ["", "posts all available commands"],
        ["info", "posts description, usage and examples of the command `info`"]
    ],
    execute(message, args)
    {
        const waitingTime = moment.duration(waitingTimeString);
        const dmFilter = dm => dm;
        const awaitOptions =
        {
            max: 1,
            time: waitingTime.asMilliseconds(),
            errors: ['time']
        };

        let emoji = defaultReactEmoji;
        const emojiManager = message.guild.emojis;
        const customEmoji = emojiManager.cache.find(emoji => emoji.name === customReactEmoji);

        if(customEmoji)
        {
            emoji = customEmoji;
        }

        let dmChannel;
        let giveaway = {};
        giveaway.serverId = message.guild.id;
        giveaway.ownerId = message.author.id;
        giveaway.channelId = message.channel.id;

        message.author.createDM()
        .then(channel =>
            {
                dmChannel = channel;
                return dmChannel.send(`To complete your giveaway, I have a few followup questions: What will you be giving away? Please answer within the next ${waitingTime.humanize()}`);
            })
        .then(message =>
            {
                giveaway.messageId = message.id;
                return dmChannel.awaitMessages(dmFilter, awaitOptions);
            })
        .then(collectedMessages =>
            {
                giveaway.price = collectedMessages.first().content;
                return dmChannel.send(`Ok! How many people can win this present? Please answer with a number greater or equal to 1 within the next ${waitingTime.humanize()}`);
            })
        .then(() =>
            {
                return dmChannel.awaitMessages(dmFilter, awaitOptions);
            })
        .then(collectedMessages =>
            {
                const winners = parseInt(collectedMessages.first().content);
                if(!winners)
                {
                    dmChannel.send(`Sorry, that is not a valid number :(`)
                    .catch(err => console.log(err));
                    throw new Error(`NaN, aborting`);
                }
                giveaway.winners = winners >= 1 ? winners : 1;
                let messageContent = `Very well. Last question: how long can people enter this giveaway?`;
                messageContent += `\nPlease answer with \`hh:mm:ss\` within the next ${waitingTime.humanize()}, e.g. \`24:00:00\` for 24 hours or \`5 00:00:00\` for 5 days`;
                return dmChannel.send(messageContent);
            })
        .then(() =>
            {
                return dmChannel.awaitMessages(dmFilter, awaitOptions);
            })
        .then(collectedMessages =>
            {
                const time = moment.duration(collectedMessages.first().content);
                if(!time)
                {
                    dmChannel.send(`Sorry, that is not a valid time :(`)
                    .catch(err => console.log(err));
                    throw new Error(`Invalid time, aborting`);
                }
                giveaway.endingTime = moment().add(time).valueOf();
            })
        .then(() =>
            {
                const messageContent = Giveaway.ToMessage(giveaway, emoji);
                return message.channel.send(messageContent);
            })
        .then(giveawayMessage =>
            {
                giveaway.messageId = giveawayMessage.id;
                return giveawayMessage.react(emoji);
            })
        .then(() =>
            {
                return giveawayDb.add(giveaway);
            })
        .catch(err =>
            {
                console.log(err);
            });
    },
}