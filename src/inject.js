/* Short function for logging */
var cLog = console.log;
var wLog = window.log;

var getChatId = (message) => {
    return message.chatId._serialized;
};

var messageHandlers = {
    "chat": (chatId, response) => {
        /* wLog(`Replaying ${response.type} from ${response.text}`); */
        if (response.reply !== undefined) {
            try {
                WAPI.ReplyMessage(response.reply, response.text);
            } catch (e) {
                wLog(e.stack);
            }
        } else {
            WAPI.sendMessage(chatId, response.text);
        }
    },
    "image": (chatId, response) => {
        try {
            /* wLog(`Replaying ${response.type} from ${response.caption}`); */
            WAPI.sendImage(response.data, chatId, response.filename, response.text);
        } catch (e) {
            wLog("Error on send Image");
        }
    }
}

var message_missed = [];

WAPI.waitNewMessages(false, async (data) => {

/*
    temp = message_missed;
    message_missed = [];
    for (let i = 0; i < data.length; i++) {
        temp[temp.length] = data[i]
    }
*/

    for (let i = 0; i < data.length; i++) {
        /* fetch API to send and receive response from server */
        let message = data[i];

        /* Logging messages  */
        timestamp = new Date(Date.now());

        wLog(`[${timestamp.toLocaleString()}] Incoming ${message.type} message from ${message.sender.pushname} (${message.from}) to ${message.to}`);

        /* This conditions for webhook */
        if (intents.appconfig.webhook) {
            fetch(intents.appconfig.webhook, {
                method: "POST",
                body: JSON.stringify(message),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((resp) => resp.json()).then(function (response) {

                /* replying to the user based on response from webhook */
                if (response && response.length > 0) {

                    response.forEach(itemResponse => {
                        try {
                            if (itemResponse.seen !== undefined) {
                                WAPI.sendSeen(getChatId(message));
                            }

                            if (itemResponse.type in messageHandlers) {

                                messageHandlers[itemResponse.type](getChatId(message), itemResponse);
                            } else {

                                wLog(`Handler for "${itemResponse.type}" doesn't exists`);
                                wLog(itemResponse);
                            }
                        } catch (e) {
                            wLog("Error on each response", itemResponse)
                            wLog(e.stack);
                        }
                    });
                }
            }).catch(function (error) {
                wLog("Has error sending to webhook.", error);
                /*message_missed[message_missed.length] = message;*/
                /*wLog("Saved for letter.");*/
                /*wLog(message_missed.length);*/
            });
        }

    }
});

WAPI.addOptions = function () {
    var suggestions = "";
    intents.smartreply.suggestions.map((item) => {
        suggestions += `<button style="background-color: #eeeeee;
                                margin: 5px;
                                padding: 5px 10px;
                                font-size: inherit;
                                border-radius: 50px;" class="reply-options">${item}</button>`;
    });
    var div = document.createElement("DIV");
    div.style.height = "40px";
    div.style.textAlign = "center";
    div.style.zIndex = "5";
    div.innerHTML = suggestions;
    div.classList.add("grGJn");
    var mainDiv = document.querySelector("#main");
    var footer = document.querySelector("footer");
    footer.insertBefore(div, footer.firstChild);
    var suggestions = document.body.querySelectorAll(".reply-options");
    for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        suggestion.addEventListener("click", (event) => {
            cLog(event.target.textContent);
            window.sendMessage(event.target.textContent).then(text => clog(text));
        });
    }
    mainDiv.children[mainDiv.children.length - 5].querySelector("div > div div[tabindex]").scrollTop += 100;
}