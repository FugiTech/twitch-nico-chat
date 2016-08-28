var WWW = {
    enabled: localStorage.getItem('www.enabled') == 'true',
    room: null,
    origPushMessage: null,
};

WWW.initialize = function(increment, delay) {
    'use strict';

    var loaded = App.__container__.lookup('controller:channel');
    if ( !loaded ) {
        increment = increment || 10;
        if ( delay < 60000 )
            setTimeout(function(){ WWW.initialize(increment, (delay||0) + increment); }, increment);
        return;
    }

    WWW.button = $('<button class="js-www-toggle player-button" style="width: 4em;"><span class="player-tip js-control-tip" data-tip="Toggle Nico Chat"></span><svg viewBox="0 0 40 30" style="width: 4em;"><text x="7" y="19" style="font-size: 9px; letter-spacing: 1px; font-weight: bold;">WWW</text><path d="M5,8 L6,7 L34,7 L35,8 L35,22 L34,23 L6,23 L5,22 L5,8 L6,9 L6,21 L7,22 L33,22 L34,22 L34,9 L33,8 L7,8 L6,9 Z"></path></svg></button>')[0];
    WWW.messageContainer =  $('<div style="position: absolute; height: 100%; width: 100%;"></div>')[0];

    $(document).on("click", ".js-www-toggle", function () {
        WWW.enabled = !WWW.enabled;
        WWW.messageContainer.style.display = WWW.enabled ? 'block' : 'none';
        localStorage.setItem('www.enabled', ''+WWW.enabled);
    });
    App.__container__.lookup("controller:channel").get('chat').addObserver("currentChannelRoom", WWW, 'setupRoom');
    App.__container__.lookup("controller:channel").addObserver("content.stream.isLoading", WWW, 'setupPlayer');
}

WWW.setupRoom = function () {
    if (WWW.room && WWW.origPushMessage) {
        WWW.room.pushMessage = WWW.origPushMessage;
    }

    WWW.room = App.__container__.lookup("controller:channel").get("chat.currentChannelRoom");
    if(!WWW.room) return;

    WWW.origPushMessage = WWW.room.pushMessage.bind(WWW.room);
    WWW.room.pushMessage = function(msg) {
        WWW.origPushMessage(msg);
        if (WWW.enabled && msg.tags) {
            var div = document.createElement('div');
            var height = 2 + 4 * Math.random();
            var duration = 5 + 6 * Math.random();
            div.style.position = 'absolute';
            div.style.width = '100%';
            div.style.color = msg.color;
            div.style.fontSize = height + 'vh';
            div.style.lineHeight = height + 'vh';
            div.style.top = (100 - height) * Math.random() + '%';
            div.style.left = '100%';
            div.style.transitionDuration = duration + 's';
            div.style.transitionProperty = 'left';
            div.style.transitionTimingFunction = 'linear';

            var tokens = [msg.message];
            var emotes = _.reduce(msg.tags.emotes, function (flattened, indicesToReplace, emoticonId) {
                if ("length" in indicesToReplace[0]) {
                    indicesToReplace.forEach(function (index) {
                        flattened.push({emoticonId: emoticonId, index: index});
                    });
                } else {
                    flattened.push({emoticonId: emoticonId, index: indicesToReplace});
                }
                return flattened;
            }, []);
            emotes = _.sortBy(emotes, function (emoticon) { return emoticon.index[0]; });
            emotes.reverse();
            _.each(emotes, function (emoticon) {
                var token = tokens.shift();
                if (token.length > emoticon.index[1] + 1) {
                    tokens.unshift(token.substr(emoticon.index[1] + 1));
                }
                var img = document.createElement('img');
                img.style.height = height + 'vh';
                img.style.verticalAlign = 'middle';
                img.src = `//static-cdn.jtvnw.net/emoticons/v1/${emoticon.emoticonId}/3.0`;
                tokens.unshift(img);
                if (emoticon.index[0]) {
                    tokens.unshift(token.substr(0, emoticon.index[0]));
                }
            });
            _.each(tokens, function (elem) {
                if (typeof(elem) === "string") {
                    elem = document.createTextNode(elem);
                }
                div.appendChild(elem);
            });

            WWW.messageContainer.appendChild(div);
            setTimeout(function(){ div.style.left = '-100%'; }, 0);
            setTimeout(function(){ div.remove(); }, duration * 1000);
        }
    };
};

WWW.setupPlayer = function() {
    $(".player-buttons-right .js-quality-display-contain").after(WWW.button);
    $(".player-video").after(WWW.messageContainer);
};

setTimeout(WWW.initialize, 100);
