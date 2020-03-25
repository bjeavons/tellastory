const rp = require('request-promise-native');

async function nextWord(word) {
    // Use Datamase Words API with left context mode. @see https://www.datamuse.com/api/
    let result = await rp({
        url: 'https://api.datamuse.com/words?lc=' + word,
        method: 'GET',
        json: true
    })
    .catch(function (err) {
        throw new Error('Datamuse request error:', err);
    });
    // @todo Filter out punctuation and numbers.
    result = result[Math.floor(Math.random() * Math.floor(result.length))];
    return result.word;
}

module.exports = {
    nextWord: nextWord
}