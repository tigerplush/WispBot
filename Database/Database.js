const Datastore = require('nedb');
const path = require('path');

class Database
{
    constructor(pathToDatabase, databaseName)
    {
        this.database = new Datastore(path.join(pathToDatabase, databaseName));
        this.database.loadDatabase();
    }

    add(doc)
    {
        return new Promise((resolve, reject) =>
        {
            this.database.insert(doc, function(err, newDoc)
            {
                if(err)
                {
                    reject(err);
                }
                resolve();
            })
        });
    }

    get(doc)
    {
        return new Promise((resolve, reject) =>
        {
            this.database.find(doc, function(err, docs)
            {
                if(err)
                {
                    reject(err);
                }
                resolve(docs);
            });
        });
    }

    getSingle(doc)
    {
        return new Promise((resolve, reject) =>
        {
            this.get(doc)
            .then(docs =>
                {
                    if(docs && docs.length > 0)
                    {
                        resolve(docs[0]);
                    }
                    reject(`${JSON.stringify(doc)} not found in database`);
                })
            .catch(err => reject(err));
        });
    }

    remove(doc)
    {
        return new Promise((resolve, reject) =>
        {
            this.database.remove(doc, function(err, number)
            {
                if(err)
                {
                    reject(err);
                }
                resolve(number);
            });
        });
    }

    removeAll(docs)
    {
        return new Promise((resolve, reject) =>
        {
            this.database.remove(docs, {multi: true}, function(err, n)
            {
                if(err)
                {
                    reject(err);
                }
                resolve(n);
            });
        });
    }

    count(doc)
    {
        return new Promise((resolve, reject) =>
        {
            this.database.count(doc, function(err, n)
            {
                if(err)
                {
                    reject(err);
                }
                resolve(n);
            })
        });
    }
}

module.exports = Database;