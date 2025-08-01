require("dotenv").config();

const TelegramApi = require("node-telegram-bot-api")

const token = process.env.BOT_TOKEN;

const bot = new TelegramApi(token, {polling: {
        autoStart: true,
        params: { timeout: 10 }
    }});

let language = "ukr", offset, mode;

const phrases = {
    ukr: {

        // commands
        start_description: "Почати з нуля",
        change_lang_description: "Змінити мову",

        // bot messages
        lang_selection: "Оберіть мову для спілкування",
        unrecognised: "Ви ввели щось незрозуміле",
        select_lang: "Спочатку оберіть мову!",
        select_correct_lang: "Оберіть корректний варіант(анг/укр)",
        lang_chosen: "Ви обрали українську мову як мову спілкування. Напишіть /language для зміни мови",
        change_mode: "Ви хочете шифрувати, чи розшифрувати повідомлення?",
        select_correct_mode: "Допустимі значення: зашифрувати, розшифрувати",
        mode_chosen: () => `Ви встановили режим ${mode === "code" ? "зашифровки" : "розшифровки"}`,
        change_mode_description: "Змінити режим шифрування/розшифрування",
        change_offset: "Оберіть зсув",
        offset_changed: () => `Поточний зсув: ${offset}. Щоб змінити, напишіть /offset`,
        change_offset_description: "Обрати зсув",
        incorrect_offset: "Укажіть число між 1 та 33",
        waiting_for_message: () => `Надішліть повідомлення для ${mode === "code" ? "зашифровки" : "розшифровки"}`,
        send_next_message: "Чекаю на наступне повідомлення",

        // user messages
        mode_code: ["шифрування", "шифрувати", "зашифрувати"],
        mode_decode: ["розшифрування", "розшифрувати"],
    },
    eng: {

        // commands
        start_description: "Start from blank",
        change_lang_description: "Select the language",

        // bot messages
        lang_selection: "Select the language",
        unrecognised: "You have entered something incorrect",
        select_lang: "Choose the language first!",
        select_correct_lang: "Choose the correct possible language(eng/ukr)",
        lang_chosen: "You have chosen English as your primary language. Type /language to change it",
        change_mode: "Do you want to code or to decode your message?",
        select_correct_mode: "Select 'code' or 'decode' only",
        mode_chosen: () => `You've successfully set you mode to ${mode === "code" ? "coding" : "decoding"}`,
        change_mode_description: "Change code/decode mode",
        change_offset: "Select the offset",
        offset_changed: () => `Current offset is set to ${offset}. Type /offset to change`,
        change_offset_description: "Change the offset",
        incorrect_offset: "Enter numbers from 1 to 26 only",
        waiting_for_message: () => `Send message for ${mode === "code" ? "coding" : "decoding"}`,
        send_next_message: "Waiting for the next message",

        // user messages
        mode_code: ["code", "coding"],
        mode_decode: ["decode", "decoding"],
    }
}

const commands = [
    {command: "/start", description: phrases[language].start_description},
    {command: "/language", description: phrases[language].change_lang_description},
    {command: "/mode", description: phrases[language].change_mode_description},
    {command: "/offset", description: phrases[language].change_offset_description},
]

const ukrAlphabet = [
    "а", "б", "в", "г", "ґ", "д", "е", "є",
    "ж", "з", "и", "і", "ї", "й", "к", "л",
    "м", "н", "о", "п", "р", "с", "т", "у",
    "ф", "х", "ц", "ч", "ш", "щ", "ь", "ю",
    "я", "а", "б", "в", "г", "ґ", "д", "е",
    "є", "ж", "з", "и", "і", "ї", "й", "к",
    "л", "м", "н", "о", "п", "р", "с", "т",
    "у", "ф", "х", "ц", "ч", "ш", "щ", "ь",
    "ю", "я", "А", "Б", "В", "Г", "Ґ", "Д",
    "Е", "Є", "Ж", "З", "И", "І", "Ї", "Й",
    "К", "Л", "М", "Н", "О", "П", "Р", "С",
    "Т", "У", "Ф", "Х", "Ц", "Ч", "Ш", "Щ",
    "Ь", "Ю", "Я", "А", "Б", "В", "Г", "Ґ",
    "Д", "Е", "Є", "Ж", "З", "И", "І", "Ї",
    "Й", "К", "Л", "М", "Н", "О", "П", "Р",
    "С", "Т", "У", "Ф", "Х", "Ц", "Ч", "Ш",
    "Щ", "Ь", "Ю", "Я",
];
const engAlphabet = [
    "a", "b", "c", "d", "e", "f", "g", "h",
    "i", "j", "k", "l", "m", "n", "o", "p",
    "q", "r", "s", "t", "u", "v", "w", "x",
    "y", "z", "a", "b", "c", "d", "e", "f",
    "g", "h", "i", "j", "k", "l", "m", "n",
    "o", "p", "q", "r", "s", "t", "u", "v",
    "y", "z", "A", "B", "C", "D", "E", "F",
    "G", "H", "I", "J", "K", "L", "M", "N",
    "O", "P", "Q", "R", "S", "T", "U", "V",
    "W", "X", "Y", "Z", "A", "B", "C", "D",
    "E", "F", "G", "H", "I", "J", "K", "L",
    "M", "N", "O", "P", "Q", "R", "S", "T",
    "U", "V", "W", "X", "Y", "Z",
];

const userStates = new Map();

function symbolApprove(e, output) {
    if (e === " "){
        return output += " ";
    } else if(e === ","){
        return output += ",";
    } else if(e === "?"){
        return output += "?";
    } else if(e === "!"){
        return output += "!"
    } else if(e === "."){
        return output += ".";
    } else if (!isNaN(e)){
        return output += e;
    }
}

async function start(){
    await bot.setMyCommands(commands)



    bot.on("message", async msg => {
        const chatId = msg.chat.id;
        const state  = userStates.get(chatId);
        let  text   = msg.text;
        let   lastState;
        console.log(msg);

        if (chatId === 857452559){
            return bot.sendMessage(chatId, "Катя смокчи яйця");
        }

        if (text !== undefined) {
            if (text === "/start") {
                lastState = null;
                offset = 0;
            }
            if (text === "/language" || text === "/start") {
                await bot.sendMessage(chatId, phrases[language].lang_selection);

                return userStates.set(chatId, "waiting_for_language");
            } else if (text === "/mode") {
                await bot.sendMessage(chatId, phrases[language].change_mode);

                return userStates.set(chatId, "waiting_for_mode");
            } else if (text === "/offset") {
                await bot.sendMessage(chatId, phrases[language].change_offset);

                return userStates.set(chatId, "waiting_for_offset");
            }


            // language change
            if (state === "waiting_for_language") {
                text = text.toLowerCase();
                if (text === "ukr" || text === "укр"){
                    language = "ukr";
                } else if (text === "eng" || text === "анг") {
                    language = "eng";
                } else {
                    lastState = lastState === "waiting_for_message" ? lastState : "waiting_for_language";
                    return bot.sendMessage(chatId, phrases[language].select_correct_lang);
                }
                await bot.setMyCommands(commands);

                lastState = lastState === "waiting_for_message" ? lastState : "waiting_for_language";
                console.log(lastState)
                userStates.set(chatId, lastState === "waiting_for_message" ? lastState : "waiting_for_mode");

                return bot.sendMessage(chatId, phrases[language].lang_chosen + "\n" + (lastState === "waiting_for_message" ? phrases[language].waiting_for_message() : phrases[language].change_mode));
            }

            // mode change
            if (state === "waiting_for_mode") {
                if (phrases[language].mode_code.includes(text.toLowerCase())) {
                    mode = "code";

                    await bot.sendMessage(chatId, phrases[language].mode_chosen() + "\n\n" + (lastState === "waiting_for_offset" ? phrases[language].waiting_for_message() : phrases[language].change_offset));

                    lastState = lastState === "waiting_for_message" ? lastState : "waiting_for_mode";
                    return userStates.set(chatId, lastState === "waiting_for_message" ? lastState : "waiting_for_offset");
                } else if(phrases[language].mode_decode.includes(text.toLowerCase())) {
                    mode = "decode";

                    await bot.sendMessage(chatId, phrases[language].mode_chosen() + "\n\n" + (lastState === "waiting_for_offset" ? phrases[language].waiting_for_message() : phrases[language].change_offset));

                    console.log(lastState);
                    lastState = lastState === "waiting_for_message" ? lastState : "waiting_for_mode";
                    console.log(lastState);
                    return userStates.set(chatId, lastState === "waiting_for_message" ? lastState : "waiting_for_offset");
                } else {
                    await bot.sendMessage(chatId, phrases[language].select_correct_mode);

                    console.log(lastState);
                    return lastState = lastState === "waiting_for_message" ? lastState : "waiting_for_mode";
                }
            }

            // offset change
            if (state === "waiting_for_offset") {
                let parsedText = parseInt(text);
                let maxOffset = language === "ukr" ? 33 : 26;

                if (!isNaN(parsedText) && parsedText <= maxOffset && parsedText >= 1) {
                    offset = parsedText;

                    await bot.sendMessage(chatId, phrases[language].offset_changed() + "\n" + (lastState === "waiting_for_message" ? phrases[language].waiting_for_message() : lastState === "waiting_for_language" ? phrases[language].select_lang : phrases[language].change_mode));

                    userStates.set(chatId, lastState !== "waiting_for_message" ? lastState : "waiting_for_message")  // coming back to last state, if not waiting_for_message
                    return lastState = lastState === "waiting_for_message" ? lastState : "waiting_for_offset";
                } else {
                    await bot.sendMessage(chatId, phrases[language].incorrect_offset);

                    return lastState = lastState === "waiting_for_message" ? lastState : "waiting_for_offset";
                }
            }

            // message processing
            if (state === "waiting_for_message") {
                let output = "";
                let messageArr = text.split("");
                let alphabet = language === "ukr" ? ukrAlphabet : engAlphabet;

                if (mode === "code") {
                    messageArr.forEach((e) => {
                        for (let i = 0; i <= alphabet.length; i++){
                            if (symbolApprove(e, output) !== undefined){
                                break;
                            }

                            if (e === alphabet[i]){
                                output += alphabet[i+offset];
                                break;
                            }
                        }
                    })
                } else {
                    messageArr.forEach((e) => {
                        for (let i = 0; i <= alphabet.length; i++){
                            if (symbolApprove(e, output) !== undefined){
                                break;
                            }

                            if (e === alphabet[i]){
                                if (alphabet === ukrAlphabet) {
                                    output += alphabet[33+i-offset];
                                    break;
                                }
                                output += alphabet[26+i-offset];
                                break;
                            }
                        }
                    })
                }
                if (output.length > 0) {
                    await bot.sendMessage(chatId, output);

                    await bot.sendMessage(chatId, phrases[language].send_next_message);

                    userStates.set(chatId, "waiting_for_message");
                    return lastState = userStates.get(chatId);
                }
            }

            return bot.sendMessage(chatId, phrases[language].unrecognised);
        } else{
            return bot.sendMessage(chatId, "Дибіл хєрньою не займайся");
        }
    })
}

start();