var _ = require('lodash'),
    Promise = require('bluebird'),
    request = require('request'),
    cheerio = require('cheerio'),
    moment = require('moment'),
    config = require('../config'),
    models = require('../models');

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
                rankings.push({ word: wordObj.word, popularity: data.length });
            });
        })
        .then(GetMnetRankings)
        .then(function(mnetRankings) {
            _.each(rankings, function(currRank) {
                _.each(mnetRankings, function(mnetRank) {
                    if (currRank.word === mnetRank.artist.toUpperCase()) {
                        currRank.popularity += parseInt(50000 / mnetRank.rank);
                    }
                });
            });
        })
        .then(getGaonRankings)
        .then(function(gaonRankings) {
            _.each(rankings, function(currRank) {
                _.each(gaonRankings, function(gaonRank) {
                    if (gaonRank.artist.toUpperCase().indexOf(currRank.word.toUpperCase()) > -1) {
                        currRank.popularity += parseInt(50000 / gaonRank.rank);
                    }
                });
            });

            rankings = _.sortBy(rankings, function(ranking) {
                return -ranking.popularity;
            });
            return res.json(rankings);
        });
    }
};

function GetMnetRankings() {
    var deferred = Promise.defer();

    var req = request('http://mwave.interest.me/mcountdown/voteState.m', function(err, resp, body) {
        var $ = cheerio.load(body),
            rankingsTable = $('.music_list_type01 tbody'),
            rankingEls = rankingsTable.children(),
            rankings = [];

        _.each(rankingEls, function(ranking) {
            var rankNum = $(ranking).find('img').attr('alt'),
                artist = $(ranking).find('.artist').text();

            rankings.push({ artist: artist, rank: rankNum });
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
            var rankNum = $(ranking).find('.ranking').text(),
                artist = $(ranking).find('.singer').text().split('|')[0];

            rankings.push({ artist: artist, rank: rankNum });
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