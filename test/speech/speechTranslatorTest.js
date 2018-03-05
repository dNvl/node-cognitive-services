const cognitive = require('../../src/index.js');
const config = require('../config.js');
const should = require('should');
const fs = require('fs');

describe.only('Speech translator', () => {

    const client = new cognitive.speechTranslator({
        apiKey: config.speechTranslator.apiKey,
        endpoint: config.speechTranslator.endpoint
    });

    describe.only('Translate text', () => {
        it("should get text", done => {
            const parameters = {
                "api-version": "1.0",
                from: "en-US",
                to: "en-US"
            };

            // Todo implement this
            const body = fs.readFileSync('./test/assets/whatstheweatherlike.wav');

            client.translateSpeech({
                parameters,
                body
            }).then(response => {
                console.log(response);
                should(response).not.be.empty;
                done();
            }).catch(err => {
                console.log(err);
                done(err);
            });
        });
    });
});