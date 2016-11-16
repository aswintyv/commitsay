
const cheerio = require('cheerio');
const request = require("request");
const Datastore = require('nedb')
const fs = require('fs');
const db = new Datastore({ filename: 'dataFile', autoload: true });
const _ = require('lodash');
var cowsay = require("cowsay");

db.count({}, function (err, count) {

    var stats = fs.statSync("dataFile");
    var mtime = new Date(stats.mtime).getTime();
    var currtime = new Date().getTime();
    if (currtime - mtime > 24 * 60 * 60 * 100 || count === 0) {
        do_api();
    }
    else if (count > 1000) {
        clear_db_and_restart();
    }
    else {
        echo_from_db();
    }
});


function clear_db_and_restart() {
    db.remove({}, { multi: true }, function (err, numRemoved) {
        do_api();
    });
}

function echo_from_db(curr_count) {
    db.count({}, function (err, count) {
        var rand = Math.floor((Math.random() * count) + 1);
        db.findOne({ id: rand }, function (err, doc) {
            if (doc) {
                console.log(cowsay.think({
                    text: doc.message + "\n           -" + doc.commiter,
                    e: "oO",
                    T: "U "
                }));
            }
            else {
                console.log(cowsay.think({
                    text: "Sometimes it's okay to not say anything.",
                    e: "oO",
                    T: "U "
                }));
            }
        });
    });

}

function do_api() {
    console.log("Scraping...");
    db.count({}, function (err, count) {
        request({ url: 'http://www.commitlogsfromlastnight.com/' }, function () {
            var html = arguments[2];
            var $ = cheerio.load(html);
            var logs = $('.post');
            var docs = [];
            _.each(logs, function (log, i) {
                var message = $(log).find('.message a').html();
                var commiter = $(log).find('.commiter').html();
                docs.push({ message: message, commiter: commiter, id: count + i });
            });
            db.insert(docs, function (err, newDocs) {
                echo_from_db();
            });

        })
    });
}

