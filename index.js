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

//Ready
const BACK = "Назад";
const WANT_A_LESSON = "Хочу урок!"
const START_MESSAGE="Привет, я ICO бот. Я помогу тебе разобраться в ICO и криптовалюте. Нажми на кнопку, если хочешь получить бесплатный урок)";
const START_STUDYING="Начать обучение";
const SUPPORT="Поддержка";
const ABOUT="О создателях курса";
const PRIVATE_CLUB="Закрытое сообщество";
const ALL_PROGRAMM="Программа всего курса";
const HOW_TO_GET_ALL_COURSE="Как пройти обучающий курс?";
const START_COURSE="Начать курс";
const PROGRAM_DESCRIPTION="Первый урок бесплатный, чтобы получить доступ к последующим двум занятиям необходимо пригласить двух друзей по реферальной ссылке: ";
const START_SCREEN="START_SCREEN";
const MAKE_TEST="Пройти тест";

//Look again
const WANT_MORE="Хочу ещё!";
const CHECK_KNOWLEDGE="Пройти тест по теме";
const FEW_REFERALLS = "Извини, но у тебя слишком мало рефераллов.";

function User(id, username, lessonsReceived, testsCompleted, referralsCount, isPaid, lastSentCourse, lastSentLesson, backCommand){
  this.id = id;
  this.username = username;
  this.lessonsReceived = lessonsReceived;
  this.testsCompleted = testsCompleted;
  this.referralsCount = referralsCount;
  this.isPaid = isPaid;
  this.lastSentCourse = lastSentCourse;
  this.lastSentLesson = lastSentLesson;
  this.backCommand = backCommand;
}

function setBackCommand(id, backCommand){
  database.ref(CHATS).child(id).child('backCommand').set(backCommand);
}

function goBack(chatId){
  database.ref(CHATS).child(chatId).child('backCommand').once('value', function(snapshot){
    var command = snapshot.val();
    switch (command) {
      case START_SCREEN:
        sendStartMessage(chatId);
        break;
      case START_STUDYING:
        startStudy(chatId);
        break;
      default:

    }
  });
}

function moreLessons(user, chatId, positionChange){
  setBackCommand(chatId, START_STUDYING);
  var userRef = database.ref(CHATS).child(user.id);
  userRef.once('value', function(snapshot){
        var data = snapshot.val();
        var currentUser = new User(data.id, data.username, data.lessonsReceived, data.testsCompleted,
         data.referralsCount, data.isPaid, data.lastSentCourse, data.lastSentLesson);
         if(positionChange==-1||(currentUser.lessonsReceived==0&&positionChange==0)){
           courseMenu(currentUser, chatId, positionChange);
           return;
         }
         if(currentUser.lessonsReceived<2){
           if(currentUser.referralsCount<2){
             bot.sendMessage(chatId, "Извини, но у тебя слишком мало рефералов.Поделись этой ссылкой!\n"+generateReferall(currentUser.id));
           }
           else {
             courseMenu(currentUser, chatId, positionChange);
           }
         } else{
           if(currentUser.isPaid||currentUser.lastSentLesson<2)
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
        userRef.set(new User(user.id, user.username, 0, 0, 0, false, 0, 0, START_SCREEN));
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
  sendStartMessage(msg.chat.id);
});

function sendStartMessage(chatId){
  bot.sendMessage(chatId, START_MESSAGE,
    {reply_markup:{
    keyboard:[
      [START_STUDYING, SUPPORT],[ABOUT, PRIVATE_CLUB]
    ]
    }});
}

function checkLink(referallId, userId, username){
  if(referallId!=userId){
    console.log(userId);
    console.log(username);
    var userRef = database.ref(CHATS).child(userId);
    userRef.once('value', function(snapshot){
      if(!snapshot.exists()){
        userRef.set(new User(userId, username, 0, 0, 0, false, 0, 0, START_MESSAGE));
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
      [WANT_MORE, PREVIOUS_COURSE],[BACK, MAKE_TEST]
    ]
    }});
  database.ref(CHATS).child(user.id).child('lastSentLesson').set(toSend);
  if((user.lastSentLesson+positionChange)>=user.lessonsReceived){
    database.ref(CHATS).child(user.id).child('lessonsReceived').set(toSend);
  }
}

function startStudy(chatId){
  setBackCommand(chatId ,START_SCREEN);
  bot.sendMessage(chatId, PROGRAM_DESCRIPTION+generateReferall(chatId),
    {reply_markup:{
    keyboard:[
      [ALL_PROGRAMM, HOW_TO_GET_ALL_COURSE],[START_COURSE,BACK]
    ]
    }});
}


function sendAllCourse(chatId){
    var opts = {
          reply_markup: JSON.stringify({
              inline_keyboard: courses.map((x, xi) => ([{
                  text: x,
                  callback_data: String(xi)
              }])),
        }),
    };
    bot.sendMessage(chatId, 'Original Text', opts);
}

bot.on("callback_query", function onCallbackQuery(callbackQuery) {
    console.log(parseInt(callbackQuery.data, 10));
    sendLessonFromQuery(callbackQuery.from.id, parseInt(callbackQuery.data, 10));
  });

function sendLessonFromQuery(chatId, courseNum){
  database.ref(CHATS).child(chatId).once('value',function(snapshot){
    var temp = snapshot.val();
    if(courseNum==0){
      bot.sendMessage(chatId, courses[courseNum]);
      return;
    }
    else if (courseNum>=1&&courseNum<4) {
      if(temp.referralsCount>=2)
        bot.sendMessage(chatId, courses[courseNum]);
      else {
        bot.sendMessage(chatId,"Для доступа к этому курсу необходимо привести двух друзей.");
      }
      return;
    }
    else{
      if (temp.isPaid) {
      bot.sendMessage(chatId, courses[courseNum]);
      }
      else{
        bot.sendMessage(chatId,"Для доступа к этому курсу необходимо внести оплату.");
      }
      return;
    }
  });
}

bot.on('message', msg=>{
  switch (msg.text) {
      case START_COURSE:
        moreLessons(msg.from, msg.chat.id, 0);
        break;
      case WANT_MORE:
        moreLessons(msg.from, msg.chat.id,1);
        break;
      case PREVIOUS_COURSE:
        moreLessons(msg.from, msg.chat.id,-1);
        break;
      case START_STUDYING:
        startStudy(msg.chat.id);
        break;
      case ALL_PROGRAMM:
        sendAllCourse(msg.chat.id);
        break;
      case HOW_TO_GET_ALL_COURSE:
        setBackCommand(msg.chat.id, START_STUDYING);
        bot.sendMessage(msg.chat.id, "Первый урок предоставляется бесплатно, 2 и 3 после приглашения двух человек, все остальные - после оплаты.",
        {reply_markup:{
        keyboard:[
          [BACK]
        ]
        }});
        break;
      case SUPPORT:
        setBackCommand(msg.chat.id ,START_SCREEN);
        bot.sendMessage(msg.chat.id, "Напиши мне свою проблему.",
        {reply_markup:{
        keyboard:[
          [BACK]
        ]
        }});
        break;
      case ABOUT:
        setBackCommand(msg.chat.id ,START_SCREEN);
        bot.sendMessage(msg.chat.id, "Создатели курсов и правообладатели бота: @justhodler, @DmitMich\nРазработка IVBOTS | Чат-боты для бизнеса",
        {reply_markup:{
        keyboard:[
          [BACK]
        ]
        }});
        break;
      case PRIVATE_CLUB:
        setBackCommand(msg.chat.id ,START_SCREEN);
        bot.sendMessage(msg.chat.id, "Для того чтобы попасть в закрытый клуб, необходимо пройти весь курс обучения и получить приглашение.",
        {reply_markup:{
        keyboard:[
          [BACK]
        ]
        }});
        break;
      case BACK:
        goBack(msg.chat.id);
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
