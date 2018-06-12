const TOKEN = "550607560:AAGx0_ZWjCDI1OPTqg9C5fUZbp5JoNJbvxc";

const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(TOKEN, {polling:true});

var firebase = require("firebase");

var config = {
    apiKey: "AIzaSyC9bAApsb03ak7dm4Ijq7TaoEc2tkSJVO4",
    authDomain: "icobottelegram.firebaseapp.com",
    databaseURL: "https://icobottelegram.firebaseio.com",
    storageBucket: "icobottelegram.appspot.com",
};
firebase.initializeApp(config);
var database = firebase.database();

const CHATS = "CHATS";
const PREVIOUS_COURSE="Предыдущий урок";

const courses = ["http://telegra.ph/Otlichie-kriptorynka-ot-tradicionnogo-06-10",
  "http://tgraph.io/Obzor-Coinmarketcap-poleznaya-ploshchadka-dlya-lyubogo-kriptoehntuziasta-06-09",
  "http://telegra.ph/Vspomogatelnye-servisy-06-10",
  "http://telegra.ph/Gajd-pokupaem-ehfir-i-zavodim-MyEtherWallet-03-07",
  "http://telegra.ph/Gajd-po-TradingView-06-10",
  "http://telegra.ph/CHto-takoe-yaponskie-svechi-06-10",
  "http://tgraph.io/CHto-takoe-tehnicheskij-analiz-06-09-2",
  "http://tgraph.io/CHto-takoe-fundamentalnyj-analiz-06-09"];

const START_MESSAGE="Привет, я ICO бот. Я помогу тебе разобраться в ICO и криптовалюте. Нажми на кнопку, если хочешь получить бесплатный урок)";
const WANT_A_LESSON="Хочу урок!";
const WANT_MORE="Хочу ещё!";
const CHECK_KNOWLEDGE="Пройти тест по теме";
const FEW_REFERALLS = "Извини, но у тебя слишком мало рефераллов.";

function User(id, username, lessonsReceived, testsCompleted, referralsCount, isPaid, lastSentCourse, lastSentLesson){
  this.id = id;
  this.username = username;
  this.lessonsReceived = lessonsReceived;
  this.testsCompleted = testsCompleted;
  this.referralsCount = referralsCount;
  this.isPaid = isPaid;
  this.lastSentCourse = lastSentCourse;
  this.lastSentLesson = lastSentLesson;
}


function moreLessons(user, chatId, positionChange){
  var userRef = database.ref(CHATS).child(user.id);
  userRef.once('value', function(snapshot){
        var data = snapshot.val();
        var currentUser = new User(data.id, data.username, data.lessonsReceived, data.testsCompleted,
         data.referralsCount, data.isPaid, data.lastSentCourse, data.lastSentLesson);
         if(positionChange==-1){
           courseMenu(currentUser, chatId, positionChange);
           return;
         }
         if(currentUser.lessonsReceived<3){
           if(currentUser.referralsCount<2){
             bot.sendMessage(chatId, "Извини, но у тебя слишком мало рефералов.Поделись этой ссылкой!"+generateReferall(currentUser.id));
           }
           else {
             courseMenu(currentUser, chatId, positionChange);
           }
         } else{
           if(currentUser.isPaid||currentUser.lastSentLesson<3)
              courseMenu(currentUser, chatId, positionChange);
            else{
                bot.sendMessage(chatId, "Остальное платно");
            }
         }
  });
}

function generateReferall(userId){
  var link = "https://telegram.me/icoTeacher_bot?start="+userId;
  console.log(link);
  return link;
}

function startMessage(user, chatId, refLink){
  if(refLink==undefined){
    var userRef = database.ref(CHATS).child(user.id);
    userRef.once('value', function(snapshot){
      if(!snapshot.exists()){
        userRef.set(new User(user.id, user.username, 0, 0, 0, false, 0, 0));
      }
    });
  }
  else{
    checkLink(refLink, user.id, user.username);
  }
}

bot.onText(/\/start/,msg=>
{
  var param = msg.text.split(" ");
  console.log(param[1]);
  startMessage(msg.from, msg.chat.id, param[1]);
  bot.sendMessage(msg.chat.id, START_MESSAGE,
    {reply_markup:{
    keyboard:[
      [WANT_A_LESSON]
    ]
    }});
});

function checkLink(referallId, userId, username){
  if(referallId!=userId){
    console.log(userId);
    console.log(username);
    var userRef = database.ref(CHATS).child(userId);
    userRef.once('value', function(snapshot){
      if(!snapshot.exists()){
        userRef.set(new User(userId, username, 0, 0, 0, false, 0, 0));
        addReferall(referallId);
      }
    });
  }
}

function addReferall(userId){
  console.log(userId);
  var reference = database.ref(CHATS).child(userId).child('referralsCount');
  reference.once('value', function(snapshot){
      console.log(snapshot.val()+1);
      reference.set(snapshot.val()+1);
    });
}

bot.on('polling_error', (error) => {
  console.log(error);  // => 'EFATAL'
});

function sendNewCourse(currentCourse, userId){
  database.ref(CHATS).child(userId).child('lessonsReceived').set(currentCourse+1);
  return "Думаю будет интересно "+courses[currentCourse+1];
}

function courseMenu(user, chatId, positionChange){
  var toSend = user.lastSentLesson+positionChange;
  if(toSend<0){
    toSend=0;
  }
  if(toSend>=courses.length-1){
    toSend=courses.length-1;
  }
  console.log(positionChange);
  console.log(toSend);
  bot.sendMessage(chatId, courses[toSend],
    {reply_markup:{
    keyboard:[
      [WANT_MORE, PREVIOUS_COURSE]
    ]
    }});
  database.ref(CHATS).child(user.id).child('lastSentLesson').set(toSend);
  if((user.lastSentLesson+positionChange)>=user.lessonsReceived){
    database.ref(CHATS).child(user.id).child('lessonsReceived').set(toSend);
  }
}

bot.on('message', msg=>{
  switch (msg.text) {
      case WANT_A_LESSON:
        bot.sendMessage(msg.chat.id,"Держи, думаю оценишь: "+courses[0],
        {reply_markup:{
        keyboard:[
          [WANT_MORE, PREVIOUS_COURSE]
        ]
        }});
        break;
      case WANT_MORE:
        moreLessons(msg.from, msg.chat.id,1);
        break;
      case PREVIOUS_COURSE:
        moreLessons(msg.from, msg.chat.id,-1);
        break;
      /*default:
        bot.sendMessage(msg.chat.id, "Используй клавиатуру!",
          {reply_markup:{
          keyboard:[
            [WANT_A_LESSON]
          ]
        }});*/
        //break;
      }
});
