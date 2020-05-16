const moment = require('moment');

const {giveawayDb, enteredUsersDb} = require('./Database/databases.js');

class Giveaway
{
    constructor(channelManager)
    {
        this.channelManager = channelManager;
    }

    check()
    {
        giveawayDb.get({})
        .then(docs =>
            {
                docs.forEach(giveaway =>
                    {
                        if(Date.now() > giveaway.endingTime)
                        {
                            this.award(giveaway);
                        }
                        else
                        {
                            this.update(giveaway);
                        }
                    });
            })
        .catch(err => console.log(err));
    }

    award(giveaway)
    {
        console.log(`giving away ${JSON.stringify(giveaway)}...`);

        enteredUsersDb.get()
        .then(docs =>
            {
                let winners = [];
                for(let i = 0; i < giveaway.winners; i++)
                {
                    let randomWinner = Math.floor(Math.random() * docs.length);
                    const winner = docs.splice(randomWinner, 1);
                    winners = winners.concat(winner);
                }

                if(winners.length > 0)
                {
                    return this.winners(giveaway, winners);
                }
                else
                {
                    return this.noWinners(giveaway);
                }
            })
        .then(message =>
            {
            })
        .then(() =>
            {
                return giveawayDb.remove(giveaway);
            })
        .then(() =>
            {
                return enteredUsersDb.removeAll({giveawayId: giveaway._id});
            })
        .catch(err => console.log(err));
    }

    winners(giveaway, winners)
    {
        return new Promise((resolve, reject) =>
        {
            let giveawayChannel;
            this.channelManager.fetch(giveaway.channelId)
            .then(channel =>
                {
                    giveawayChannel = channel;
                    let have = "have";
                    if(winners.length === 1)
                    {
                        have = "has";
                    }
                    let messageContent = `<@${winners.map(winner => winner.userId).join('>, <@')}> ${have} won <@${giveaway.ownerId}>s giveaway for ${giveaway.price}`;
                    return giveawayChannel.send(messageContent);
                })
            .then(() =>
                {
                    return giveawayChannel.messages.fetch(giveaway.messageId);
                })
            .then(message =>
                {
                    let messageContent = `<@${giveaway.ownerId}>s giveaway for ${giveaway.price} has ended!`
                    return message.edit(messageContent);
                })
            .then(message => resolve(message))
            .catch(err => reject(err));
        });
    }

    noWinners(giveaway)
    {
        return new Promise((resolve, reject) =>
        {
            let giveawayChannel;
            this.channelManager.fetch(giveaway.channelId)
            .then(channel =>
                {
                    giveawayChannel = channel;
                    let messageContent = `There were no entries for <@${giveaway.ownerId}>s giveaway for ${giveaway.price}, so the giveaway ends without winners :cry:`;
                    return giveawayChannel.send(messageContent);
                })
            .then(() =>
                {
                    return giveawayChannel.messages.fetch(giveaway.messageId);
                })
            .then(message =>
                {
                    let messageContent = `<@${giveaway.ownerId}>s giveaway for ${giveaway.price} has ended!`
                    return message.edit(messageContent);
                })
            .then(message => resolve(message))
            .catch(err => reject(err));
        });
    }

    enter(giveaway, user)
    {
        giveawayDb.getSingle(giveaway)
        .then(giveawayInfo =>
            {
                const giveawayEntree =
                {
                    giveawayId: giveawayInfo._id,
                    serverId: giveawayInfo.serverId,
                    userId: user.id
                };
                return enteredUsersDb.add(giveawayEntree);
            })
        .catch(err => console.log(err));
    }

    leave(giveaway, user)
    {
        giveawayDb.getSingle(giveaway)
        .then(giveawayInfo =>
            {
                const giveawayEntree =
                {
                    giveawayId: giveawayInfo._id,
                    serverId: giveawayInfo.serverId,
                    userId: user.id
                };
                return enteredUsersDb.remove(giveawayEntree);
            })
        .catch(err => console.log(err));
    }

    update(giveaway)
    {
        this.channelManager.fetch(giveaway.channelId)
        .then(channel =>
            {
                return channel.messages.fetch(giveaway.messageId);
            })
        .then(message =>
            {
                const emoji = message.reactions.cache.first().emoji;
                const messageContent = Giveaway.ToMessage(giveaway, emoji);
                return message.edit(messageContent);
            })
        .catch(err => console.log(err));
    }

    static ToMessage(giveaway, emoji)
    {
        const endingTime = moment().to(giveaway.endingTime);
        let messageContent = `<@${giveaway.ownerId}> is giving away ${giveaway.price}! ${giveaway.winners} can win this prize!`;
        messageContent += `\nThis giveaway is ending ${endingTime}`;
        messageContent += `\nReact with ${emoji} to enter the giveaway`;
        return messageContent;
    }
};

module.exports = Giveaway;