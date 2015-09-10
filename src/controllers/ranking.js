var _ = require('lodash'),
    Promise = require('bluebird'),
    request = require('request'),
    cheerio = require('cheerio'),
    moment = require('moment'),
    config = require('../config'),
    models = require('../models');

var CHART_WEIGHT = 50000;

var RankingController = {
    index: function(req, res) {
        var statistic = req.query.statistic,
            startTime = moment(),
            endTime,
            rankings = [];

        if (!statistic) {
            statistic = 'hour';
        }

        if (statistic === 'hour') {
            endTime = moment().subtract(1, 'hours');
        } else if (statistic === 'day') {
            endTime = moment().subtract(1, 'days');
        } else {
            endTime = moment(1318781876406);
        }

        // Calculate rankings based on mentions, chart rankings (gaon, mnet), subreddit, and blog posts
        // Value chart rankings, reddit, and blog posts higher than tweets
        // Force popular new releases towards the top by weighing chart rankings heavily

        // First get number of mentions for each word, then find chart rankings and modify popularity accordingly
        // TODO: Move chart rankings to database instead of making a request and parsing every time a request comes in
        Promise.map(config.keywords, function(wordObj) {
            return models.Mentions.getWithinTime(wordObj.word, startTime.toDate(), endTime.toDate()).then(function(data) {
                rankings.push({ wordObj: wordObj, popularity: data.length });
            });
        })
        .then(GetMnetRankings)
        .then(function(mnetRankings) {
            console.log(rankings);
            _.each(rankings, function(currRank) {
                _.each(mnetRankings, function(mnetRank) {
                    if (isInRankings(mnetRankings, currRank.wordObj, mnetRank.artist)) {
                        currRank.popularity += parseInt(CHART_WEIGHT / mnetRank.rank);
                    }
                });
            });
        })
        .then(getGaonRankings)
        .then(function(gaonRankings) {
            console.log('gaon', gaonRankings);
            _.each(rankings, function(currRank) {
                _.each(gaonRankings, function(gaonRank) {
                    if (isInRankings(gaonRankings, currRank.wordObj, gaonRank.artist)) {
                        currRank.popularity += parseInt(CHART_WEIGHT / gaonRank.rank);
                    }
                });
            });

            rankings = _.sortBy(rankings, function(ranking) {
                return -ranking.popularity;
            });

            var output = [];
            _.each(rankings, function(ranking) {
                output.push({
                    artist: ranking.wordObj.word,
                    popularity: ranking.popularity
                });
            });

            return res.json(output);
        });
    }
};

function isInRankings(parsedRankings, wordObj, parsedArtistName) {
    var artistFoundInRankings = false;

    if (wordObj.word.toUpperCase().indexOf(parsedArtistName.toUpperCase()) > -1) {
        artistFoundInRankings = true;
    }

    _.each(wordObj.alternateWords, function(word) {
        _.each(parsedRankings, function(rank) {
            if (word.toUpperCase().indexOf(rank.artist.toUpperCase()) > -1) {
                artistFoundInRankings = true;
            }
        });
    });

    return artistFoundInRankings;
}

function GetMnetRankings() {
    var deferred = Promise.defer();

    var req = request('http://mwave.interest.me/mcountdown/voteState.m', function(err, resp, body) {
        var $ = cheerio.load(body),
            rankingsTable = $('.voteWeekListResult'),
            rankingOrderedLists = rankingsTable.children().last(),
            top3OrderedList = rankingsTable.children().first();
            rankings = [];

        _.each(top3OrderedList, function(orderedList) {
            var rankingListItems = $(orderedList).children();
            _.each(rankingListItems, function(listItem) {
                var rank = $(listItem).find('i.rank').text().trim();
                var artist = $(listItem).find('.title').children().last().text().trim();

                rankings.push({ artist: artist, rank: rank });
            });
        });

        _.each(rankingOrderedLists, function(orderedList) {
            var rankingListItems = $(orderedList).children();
            _.each(rankingListItems, function(listItem) {
                var rank = $(listItem).find('i.rank').text().trim();
                var artist = $(listItem).find('.artist').find('a').text().trim();

                if (artist !== '' && rank !== '') {
                    rankings.push({ artist: artist, rank: rank });
                }
            });
        });

        deferred.resolve(rankings);
    });

    return deferred.promise;
}

function getGaonRankings() {
    var deferred = Promise.defer();

    var req = request('http://gaonchart.co.kr/main/section/chart/online.gaon?nationGbn=T&serviceGbn=ALL', function(err, resp, body) {
        var $ = cheerio.load(body),
            rankingsTable = $('.chart').find('table'),
            rankingEls = rankingsTable.children(),
            rankings = [];

        _.each(rankingEls, function(ranking) {
            var rankNum = $(ranking).find('.ranking').text().trim(),
                artist = $(ranking).find('.singer').text().split('|')[0].trim();
            if (rankNum !== '' && artist !== '') {
                rankings.push({ artist: artist, rank: rankNum });
            }
        });

        deferred.resolve(rankings);
    });

    return deferred.promise;
}

function getMelonRankings() {
    var deferred = Promise.defer();

    var req = request('http://www.melon.com/chart/index.htm', function(err, resp, body) {
        var $ = cheerio.load(body),
            rankingsTable = $('table tbody'),
            rankingEls = rankingsTable.children(),
            rankings = [];

        _.each(rankingEls, function(ranking) {
            var rankNum = $(ranking).find('.rank').text(),
                artist = $(ranking).find('a.play_artist').children().first().text();

            rankings.push({ artist: artist, rank: rankNum });
        });

        deferred.resolve(rankings);
    });

    return deferred.promise;
}

module.exports = RankingController;