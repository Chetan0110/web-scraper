const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

var MongoClient = require('mongodb').MongoClient;

var mongoLocal = 'mongodb://localhost/Medium';

const URL = "https://medium.com";

const arr = []

request(URL, function (err, res, body) { 
    if(err) 
    { 
        console.log(err); 
    } 
    else
    { 
        let $ = cheerio.load(body); 
        $('div.site-main > div.surface > div.screenContent').each(function(index){ 
              
            const links = $(this).find(this.name +'.'+ this.attribs.class + '> a')

            if(links.length === 0) {
                for(let i = 0; i < this.childNodes.length; i++) {
                    let element = this.childNodes[i]
                    recursivelyCrawl(element)
                }
            } else {
                for(let j = 0; j < links.length; j++) {
                    const link = $(links[j]).attr('href')
                    MongoClient.connect(mongoLocal,{ useNewUrlParser: true }, function(err, client) {
                        let db = client.db('Medium')
                        const record = db.collection('Link').findOne({link: link})
                        if(record) {
                            record.referenceCount = record.referenceCount++;
                            db.collection('Link').findOneAndUpdate({link: link}, record)
                        } else {
                            let obj = {
                                link: link,
                                referenceCount: 1,
                                paramList: []
                            }
                            db.collection('Link').insertOne(obj)
                        }
                        client.close()
                    })                    
                    requestToURL(link)
                }
            }
        }); 
    

        // Working code

        //

        // MongoClient.connect(mongoLocal,{ useNewUrlParser: true }, function(err, client) {
        //     console.log("Connected...");
        //     let db = client.db('Medium')
        //     db.collection('Link').insertOne({
        //         link: URL,
        //         referenceCount: 2,
        //         paramsList:[
        //             { param1: "param1", value: "abc" },
        //             { param2: "param2", value: "def" }
        //         ] 
        //     })
        //     console.log("Done...");
        //     client.close();
        // })
  
    } 
}); 


function recursivelyCrawl(element) {
    let $ = cheerio.load(element);

    let currentEl = element ? element.attribs ? element.attribs.class ? element.name + "." + element.attribs.class.trim() : element.name : element.name : element.name
    
    const links = $(element).find(currentEl + ' > a')
    if(links.length === 0) {
        if(element.childNodes) {
            for(let i = 0; i < element.childNodes.length; i++) {
                let child = element.childNodes[i]
                recursivelyCrawl(child)
            }
        }
    } else {
        for(let j = 0; j < links.length; j++) {
            const link = $(links[j]).attr('href')

            MongoClient.connect(mongoLocal,{ useNewUrlParser: true }, async function(err, client) {
                let db = client.db('Medium')
                const record = await db.collection('Link').findOne({link: link})
                if(record) {
                    record.referenceCount = record.referenceCount++;
                    db.collection('Link').updateOne({link: link}, {$set: record})
                } else {
                    let obj = {
                        link: link,
                        referenceCount: 1,
                        paramList: []
                    }
                    db.collection('Link').insertOne(obj)
                }
                client.close()
            })

            requestToURL(link)
        }
    }

}

function requestToURL(url) {
    console.log(url+"\n")
    request(url, function (err, res, body) { 
        if (err) { 
            console.log(err); 
        } else {

            let $ = cheerio.load(body); 
            $('div.site-main > div.surface > div.screenContent').each(function(index){ 
                
                const links = $(this).find(this.name +'.'+ this.attribs.class + '> a')

                if(links.length === 0) {
                    for(let i = 0; i < this.childNodes.length; i++) {
                        let element = this.childNodes[i]
                        recursivelyCrawl(element)
                    }
                } else {
                    for(let j = 0; j < links.length; j++) {
                        const link = $(links[j]).attr('href')

                        MongoClient.connect(mongoLocal,{ useNewUrlParser: true }, function(err, client) {
                            let db = client.db('Medium')
                            const record = db.collection('Link').findOne({link: link})
                            if(record) {
                                record.referenceCount = record.referenceCount++;
                                try {
                                    db.collection('Link').updateOne({link: link}, {$set: record}).catch((e) => {
                                        console.log(e)
                                    })
                                } catch (e) {
                                    console.error(e)
                                }
                            } else {
                                let obj = {
                                    link: link,
                                    referenceCount: 1,
                                    paramList: []
                                }
                                db.collection('Link').insertOne(obj)
                            }
                            client.close()
                        })

                        requestToURL(link)
                    }
                }
            }); 
    
            // let element = body;

            // let $ = cheerio.load(body);

            // let currentEl = element ? element.attribs ? element.name + "." + element.attribs.class.trim() : element.name : element.name
    
            // const links = $(body).find(currentEl + ' > a')

            // if(links.length === 0) {
            //     if(body.childNodes) {
            //         for(let i = 0; i < body.childNodes.length; i++) {
            //             let element = body.childNodes[i]
            //             recursivelyCrawl(element)
            //         }
            //     }
            // } else {
            //     for(let j = 0; j < links.length; j++) {
            //         const link = links[j].attr('href')
            //         requestToURL(link)
            //     }
            // }
        }
    })
} 