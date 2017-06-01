'use strict'
const Botmaster = require('botmaster');
const watson = require('watson-developer-cloud');
const cfenv = require('cfenv');
const Context = require('./context');
const Cloudant = require('./cloudant');
// get the app environment from Cloud Foundry
const appEnv = cfenv.getAppEnv();
const watsonConversation = watson.conversation({
  username: process.env.WATSON_CONVERSATION_USERNAME,
  password: process.env.WATSON_CONVERSATION_PASSWORD,
  version: 'v1',
  version_date: '2016-05-19',
});

const messengerSettings = {
  credentials: {
    verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
    pageToken: process.env.MESSENGER_PAGE_TOKEN,
    fbAppSecret: process.env.MESSENGER_APP_SECRET,
  },
  webhookEndpoint: process.env.MESSENGER_WEBHOOKENDPOINT,
};
/*
 * Where the actual code starts. This code is actually all that is required
 * to have a bot that works on the various different channels and that
 * communicates with the end user using natural language (from Watson Conversation).
 * If a conversation is properly trained on the system, no more code is required.
 */
const botsSettings = [{
  messenger: messengerSettings
}];
const express = require('express');
const bots = express();
const bodyParser = require('body-parser');
bots.use(bodyParser.json());
bots.use(bodyParser.urlencoded({
  extended: true
}));
const botmasterSettings = {
  botsSettings,
  app: bots,
    port: appEnv.isLocal ? 3000 : appEnv.port,
};
const delay = 1200;
const botmaster = new Botmaster(botmasterSettings);
const inMemoryContexts = {};
botmaster.on('update', (bot, update) => {
  var optionalDelay = 0;
  var firstText = "";
  var context = inMemoryContexts[update.sender.id];
  if (inMemoryContexts[update.sender.id]) {
    context = Context.setContextToWatson(JSON.parse(JSON.stringify(context)),
      update.message.text);
  } else {
    const messageForWatson = {
      context,
      workspace_id: process.env.WORKSPACE_ID,
        input: {
          text: "",
        },
    };
    watsonConversation.message(messageForWatson, (err, watsonUpdate) => {
      Context.setContextAfterWatson(watsonUpdate);
      inMemoryContexts[update.sender.id] = watsonUpdate.context;
      context = JSON.parse(JSON.stringify(watsonUpdate.context));
      const text = watsonUpdate.output.text[0];
      firstText = text;
      setTimeout(function() {
        bot.sendIsTypingMessageTo(update.sender.id);
      }, 250);
      setTimeout(function() {
          bot.sendTextMessageTo(text, update.sender.id);
      }, delay);
    });
    optionalDelay = 1200;
  }
  setTimeout(function() {
    var input = "";
    if (update.message.text) {
      input = JSON.stringify(update.message.text);
      //Remove quotation marks
      input = input.substring(1, input.length - 1);
      //Replace \n
      input = input.replace(/\\n/g, " ");
    }
    const messageForWatson = {
      context,
      workspace_id: process.env.WORKSPACE_ID,
        input: {
          text: input,
        },
    };
    //THIS LINE READS THE USER INPUT
    //bot.sendTextMessageTo(String(JSON.stringify(update.message)),update.sender.id);
      setTimeout(function() {
        watsonConversation.message(messageForWatson, (err,
          watsonUpdate) => {
          Context.setContextAfterWatson(watsonUpdate);
          inMemoryContexts[update.sender.id] = watsonUpdate.context;
          for (var i = 0; i < watsonUpdate.output.text.length; i++) {
            const text = watsonUpdate.output.text[i];
            if(text !== firstText){
            setTimeout(function() {
              bot.sendIsTypingMessageTo(update.sender.id);
            }, optionalDelay + delay * i + 250);
            setTimeout(function() {
                bot.sendTextMessageTo(text, update.sender.id);

            }, optionalDelay + delay * (i + 1));}
          }
          Cloudant.updateMessage(messageForWatson, watsonUpdate);
        })
      }, optionalDelay);
  }, optionalDelay / 3);
  Cloudant.saveLastMessage();
});
botmaster.on('error', (bot, err) => {
  console.log(err.stack);
});
module.exports = bots;
