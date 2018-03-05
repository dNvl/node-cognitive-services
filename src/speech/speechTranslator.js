'use strict';
const commonService = require('../commonService');
const tokenService = require('../tokenService');
const xmlBuilder = require('xmlbuilder');
const WebSocketClient = require('websocket').client;
const { verifyBody, verifyEndpoint, verifyHeaders, verifyParameters } = require('../helpers');
const fs = require('fs');
const path = require('path');
const streamBuffers = require('stream-buffers');

/**
 * The cloud-based Microsoft Speech API provides developers an easy way to create powerful speech-enabled features in their applications, like voice command control, user dialog using natural speech conversation, and speech transcription and dictation. The Microsoft Speech API supports both Speech to Text and Text to Speech conversion.

- SpeechTranslate will translate a given stream of audio into text given in the target language
 *
 * @augments commonService
 * @link https://docs.microsoft.com/en-us/azure/cognitive-services/speech/home
 */

class speechTranslator extends commonService {
    /**
     * Constructor.
     *
     * @param {Object} obj
     * @param {string} obj.apiKey
     */
    constructor({ apiKey, endpoint }) {
        super({ apiKey, endpoint });
        this.apiKey = apiKey;
        this.appName = 'node-cognitive-services';
        this.endpoints = [
            endpoint
        ];
    }

    /**
     * Returns translated audio in text format
     * @param {*} param0
     * @returns {Promise.<object>}
     */
    translateSpeech({ parameters, body }) {

        const operation = {
            "path": "speech/translate",
            "method": "GET",
            "headers": [{
                "name": "X-ClientTraceId",
                "value": "",
                "description": "Client generated GUID to trace the request",
                "required": false,
                "typeName": "string"
            }, {
                "name": "X-CorrelationId",
                "value": "1",
                "description": "A client-generated identifier used to correlate multiple channels in a conversation",
                "required": false,
                "typeName": "string"
            }, {
                "name": "X-ClientVersion",
                "value": "1.0",
                "description": "The client version",
                "required": false,
                "typeName": "string"
            }, {
                "name": "X-OsPlatform",
                "value": "",
                "description": "The client OS platform",
                "required": false,
                "typeName": "string"
            }],
            "parameters": [{
                "name": "api-version",
                "description": "The api version that should be used",
                "value": "1.0",
                "required": true,
                "type": "queryStringParam",
                "typeName": "string"
            }, {
                "name": "from",
                "description": "Specifies the source language",
                "value": null,
                "required": true,
                "type": "queryStringParam",
                "typeName": "string"
            }, {
                "name": "to",
                "description": "Specifies the result language",
                "value": null,
                "required": true,
                "type": "queryStringParam",
                "typeName": "string"
            }, {
                "name": "features",
                "description": "Comma separated set of featues",
                "value": null,
                "options": [
                    "TextToSpeech", "Partial", "TimingInfo"
                ],
                "required": false,
                "type": "queryStringParam",
                "typeName": "string"
            }, {
                "name": "voice",
                "description": "The voice that should be used for the translation",
                "value": null,
                "required": false,
                "type": "queryStringParam",
                "typeName": "string"
            }, {
                "name": "format",
                "description": "The file format specified for the services response",
                "value": null,
                "options": [
                    "audio/wav", "audio/mp3"
                ],
                "required": false,
                "type": "queryStringParam",
                "typeName": "string"
            }, {
                "name": "ProfanityAction",
                "description": "Specifies how the service will handle profanities",
                "value": null,
                "options": [
                    "NoAction", "Marked", "Deleted"
                ],
                "required": false,
                "type": "queryStringParam",
                "typeName": "string"
            }, {
                "name": "ProfanityMarker",
                "description": "Specifies how the service will mark profanities if ProfanityAction is set to Marked",
                "value": null,
                "options": [
                    "Asterisk", "Tag"
                ],
                "required": false,
                "type": "queryStringParam",
                "typeName": "string"
            }, {
                "name": "X-ClientTraceId",
                "description": "Client generated GUI to trace the request",
                "required": false,
                "typeName": "string"
            }, {
                "name": "X-CorrelationId",
                "description": "A client-generated identifier used to correlate multiple channels in a conversation",
                "required": false,
                "typeName": "string"
            }, {
                "name": "X-ClientVersion",
                "description": "A client-generated identifier used to correlate multiple channels in a conversation",
                "required": false,
                "typeName": "string"
            }, {
                "name": "X-OsPlatform",
                "description": "A client-generated identifier used to correlate multiple channels in a conversation",
                "required": false,
                "typeName": "string"
            }]
        };

        return this.makeWebSocketRequest({
            operation: operation,
            parameters: parameters,
            headers: operation.headers,
            body: body
        });
    }

    sendFileFromPath(filepath, wSConnection, callback) {
        let absoluteFilepath;

        fs.access(filepath, (error) => {
            if (error) {
                return callback ? callback(new Error(`could not find file ${filepath}`)) : null;
            }

            absoluteFilepath = path.resolve(filepath);

            const options = {
                frequency: 100,
                chunkSize: 32000
            };

            const audioStream = new streamBuffers.ReadableStreamBuffer(options);

            fs.readFile(absoluteFilepath, (error, file) => {
                audioStream.put(file);

                // add some silences at the end to tell the service that it is the end of the sentence
                audioStream.put(new Buffer(160000));
                audioStream.stop();

                audioStream.on('data', (data) => wSConnection.sendBytes(data));
                // console.log(wSConnection.connected);
                audioStream.on('end', () => { if (callback) return callback() });
            });
        });
    };


    makeWebSocketRequest(data = {}) {
        const operation = data.operation || {};
        const headers = data.headers || {};

        return new Promise((resolve, reject) => {
            const dbgHeaders = {
                "Ocp-Apim-Subscription-Key": this.apiKey
            };

            let path = operation.path;
            let uri = `wss://${this.endpoint}/${path}`;
            let reqUri = uri + '?api-version=1.0&from=en-US&to=de-DE';
            console.log(reqUri);

            // Create the configuration
            const config = {
                "fragmentOutgoingMessages": true,
                "fragmentationThreshold": 160,
            };

            // Now send the request
            const ws = new WebSocketClient(config);

            // Handle errors during connection init
            ws.once('connectFailed', (error) => {
                console.debug("Connection failed: ");
                console.debug(error);
                return error;
            });

            // Handle a success in the connection
            ws.once('connect', (connection) => {
                connection.on('error', (error) => {
                    console.log('Connection error ...');
                    reject(error);
                });

                connection.on('close', (close) => {
                    console.log('Connection closing ...');
                    reject(close);
                });

                connection.on('message', (message) => {
                    console.log('Message rec ... ');
                    resolve(message);
                    connection.close();
                });

                if (connection.connected) {
                    this.sendFileFromPath("./test/assets/whatstheweatherlike.wav", connection, function () {
                        console.log("Req sent ...");
                    });
                } else {
                    reject(connection.connected);
                }
            });

            // Eventually try to establish a connection
            ws.connect(reqUri, null, null, dbgHeaders);
        });
    }
};

module.exports = speechTranslator;