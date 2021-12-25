'use strict';

const config = {
  channelAccessToken: '【LINEチャネルアクセストークン（長期）】',
  channelSecret: '【LINEチャネルシークレット】',
};
const SWITCHBOT_OPENTOKEN = "【SwitchBotのトークン】";
const RICHMENU_ID = "【LINEリッチメニューID】";

const HELPER_BASE = process.env.HELPER_BASE || '../../helpers/';
const LineUtils = require(HELPER_BASE + 'line-utils');
const line = require('@line/bot-sdk');
const app = new LineUtils(line, config);
if( RICHMENU_ID )
  app.client.setDefaultRichMenu(RICHMENU_ID);

const SwitchBot = require('./switchbot');
const switchbot = new SwitchBot(SWITCHBOT_OPENTOKEN);

switchbot.getDeviceList()
.then(json =>{
  console.log(json);
});

const command_list = [
  // コマンドリスト
];

app.message(async (event, client) =>{
  console.log(event);

  var command = command_list.find(item => event.message.text.indexOf(item.disp) >= 0 );
  if( command ){
    var message = await processCommand(app, command);
    return client.replyMessage(event.replyToken, message);
  }else{
    var message = { type: 'text', text: event.message.text + ' ですね。' };
    message.quickReply = makeQuickReply(app);
    return client.replyMessage(event.replyToken, message);
  }
});

app.postback(async (event, client) =>{
  var command = command_list.find(item => item.disp == event.postback.data);
  var message = await processCommand(app, command);
  return client.replyMessage(event.replyToken, message);
});

async function processCommand(app, command){
  if( command.commandType == "Meter"){
    var json = await switchbot.getDeviceStatus(command.deviceId);
    console.log(json);
    var message = app.createSimpleResponse("温度は " + json.temperature + "℃、湿度は " + json.humidity + "% です。");
    message.quickReply = makeQuickReply(app);
    return message;
  }else{
    await switchbot.sendDeviceControlCommand(command.deviceId, command.commandType, command.command, command.parameter);
    var message = app.createSimpleResponse("送信しました。");
    message.quickReply = makeQuickReply(app);
    return message;
  }
}

function makeQuickReply(app){
  var list = [];
  command_list.forEach((item)=>{
    list.push({
      title: item.disp,
      action: {
        type: "postback",
        data: item.disp
      }
    });
  });
  var quickReply = app.createQuickReply(list);
  return quickReply;
}

exports.fulfillment = app.lambda();