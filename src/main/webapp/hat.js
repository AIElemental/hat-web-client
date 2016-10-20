/* Hat code */
/* State vars */
var backend = '';

var state_state = "no_room";
var state_room_name = '';
var state_room_pass = '';
var state_words_per_player = 20;
var state_turn_time_sec = 20;
var state_player_name = '';
var state_situp = [];
var state_turn_name = '';
var state_turn_num = 0;

var reroll_available = true;
var turn_active = false;
var turn_timed_out = false;
var state_words_done = [];
var state_words_for_turn = [];
var state_last_word_time = 0;

var const_ui_state_no_room = 0;
var const_ui_state_in_room = 1;
var const_ui_state_word_gen = 2;
var const_ui_state_turn_other = 3;
var const_ui_state_turn_me = 4;
var const_ui_state_endgame = 5;
var const_ui_state_player_name = 6;

/* Common functions */
function getDateTime() {
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    if (hour.toString().length == 1) {
        hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        minute = '0' + minute;
    }
    if (second.toString().length == 1) {
        second = '0' + second;
    }
    return hour + ':' + minute + ':' + second;
}

function log(message) {
    message = getDateTime() + ' ' + message;
    console.log(message);
    $("#log").prepend('<div>' + message + '</div>');
}

function get_or_default(obj, default_obj) {
    if (obj == undefined || obj === '') {
        return default_obj;
    } else {
        return obj;
    }
}

function debug_state() {
    var debug_state = $("#debug_state");
    debug_state.html("");
    debug_state.append("<span style='display:block;'>state_state=" + state_state + "</span>");
    debug_state.append("<span style='display:block;'>state_room_name=" + state_room_name + "</span>");
    debug_state.append("<span style='display:block;'>state_room_pass=" + state_room_pass + "</span>");
    debug_state.append("<span style='display:block;'>state_words_per_player=" + state_words_per_player + "</span>");
    debug_state.append("<span style='display:block;'>state_turn_time_sec=" + state_turn_time_sec + "</span>");
    debug_state.append("<span style='display:block;'>state_player_name=" + state_player_name + "</span>");
    debug_state.append("<span style='display:block;'>state_turn_name=" + state_turn_name + "</span>");
    debug_state.append("<span style='display:block;'>state_turn_num=" + state_turn_num + "</span>");
}

var timerId;
function activateTimer(time) {
    var start = new Date;
    timerId = setInterval(function () {
        get_turn_timer().text(Math.round((time - (new Date - start) / 1000)) + " Seconds");
    }, 171);
}
function stopTimer() {
    clearInterval(timerId);
}

function post_message(message) {
    message = getDateTime() + ' ' + message + ' (click to hide)';
    log('post_message: ' + message);
    $("#infobox").addClass("button warning block-shadow-warning text-shadow").text(message).show();
}

/* State change functions */
function set_state(state) {
    log("state_state: " + state_state + "->" + state);
    state_state = state;
    Cookies.set('ht_state', state, {expires: 7});
    debug_state();
}

function set_player_name(player_name) {
    log("state_player_name: " + state_player_name + "->" + player_name);
    var pattern = /[a-z0-9]+/i;
    if (pattern.test(player_name)) {
        state_player_name = player_name;
        Cookies.set('ht_player_name', player_name, {expires: 7});
        $('#ui_player_name').text(state_player_name);
        $('#nav_player').text(state_player_name);
        $('#nav_player_input').val(state_player_name);
        debug_state();
    } else {
        post_message("Player name can contain only letters and numbers");
    }
}

function set_room_name(room_name) {
    log("state_room_name: " + state_room_name + "->" + room_name);
    state_room_name = room_name;
    // $('#ui_room_name').text(state_room_name + ' wpp:' + state_words_per_player + ' spt' + state_turn_time_sec);
    $('#ui_room_name').text(state_room_name + ' w:' + state_words_per_player + ' t:' + state_turn_time_sec);
    Cookies.set('ht_room_name', room_name, {expires: 7});
    debug_state();
}

function set_room_password(room_pass) {
    log("state_room_pass: " + state_room_pass + "->" + room_pass);
    state_room_pass = room_pass;
    Cookies.set('ht_room_pass', room_pass, {expires: 7});
    debug_state();
}

function set_words_per_player(words) {
    log("state_words_per_player: " + state_words_per_player + "->" + words);
    state_words_per_player = words;
    Cookies.set('ht_wpp', words, {expires: 7});
    $('#ui_words_per_player').text(' (' + state_words_per_player + ' words)');
    debug_state();
}

function set_turn_time_sec(secs) {
    log("state_turn_time_sec: " + state_turn_time_sec + "->" + secs);
    state_turn_time_sec = secs;
    Cookies.set('ht_tts', secs, {expires: 7});
    debug_state();
}

function set_turn_name(turn_name) {
    log("state_turn_name: " + state_turn_name + "->" + turn_name);
    state_turn_name = turn_name;
    Cookies.set('ht_tplayer', state_turn_name, {expires: 7});
    debug_state();
}

function set_backend(url_string) {
    log('backend at ' + url_string);
    backend = url_string;
    Cookies.set('ht_wsbe', url_string, {expires: 7});
    if (url_string && url_string !== '') {
        $('#nav_backend').text(url_string);
        $('#backend').val(url_string);
    }
    debug_state();
}

function set_situp(situp_schema) {
    log('set situp = ' + situp_schema);
    state_situp = situp_schema;
}

function partner(player_name) {
    var player_index = state_situp.indexOf(player_name);
    player_index = (player_index + state_situp.length / 2) % state_situp.length;
    return state_situp[player_index];
}

function room_create(room_name, room_pass, player_name, words_pers, sec_turn) {
    log('Create room' + room_name + ' ' + room_pass + ' ' + player_name + ' ' + words_pers + ' ' + sec_turn);
    ws_request_create_room(room_name, room_pass, player_name, words_pers, sec_turn);
}

function room_try_enter(room_name, room_pass, player_name) {
    log('Trying to enter room_name=' + room_name + ' room_pass=' + room_pass + ' player_name=' + player_name);
    ws_request_enter_room(room_name, room_pass, player_name, state_words_per_player, state_turn_time_sec);
}

function room_try_reconnect(room_name, room_pass, player_name) {
    log('Reconnecting: room_name=' + room_name + ' room_pass=' + room_pass + ' player_name=' + player_name);
    ws_request_reconnect_room(room_name, room_pass, player_name, "-1", "-1");
}

function try_set_player_name(player_name) {
    var pattern = /^[a-z0-9]{1,8}$/i;
    if (pattern.test(player_name)) {
        ws_request_set_name(player_name);
    } else {
        post_message("Player name should be 1-8 letters or digits");
    }
    //todo add some loading bar;
}

function room_enter(room_name, room_pass, player_name, word_per_player, seconds_per_turn) {
    log('Entering room_name=' + room_name + ' pass=' + room_pass + ' player=' + player_name + ' word=' + word_per_player + ' sec=' + seconds_per_turn);

    //usability (won't have to retype on refresh)
    set_room_name(room_name);
    set_room_password(room_pass);
    set_words_per_player(word_per_player);
    set_turn_time_sec(seconds_per_turn);

    set_ui_layout(const_ui_state_in_room);
}

function room_find() {
    log('Find rooms');
    ws_request_get_room_list(state_player_name);
}

/**
 * display found rooms in UI;
 * @param room_names
 */
function set_found_rooms(room_names) {
    var option = '';
    if (room_names.length == 0) {
        option = '<option value="blank">No rooms found</option>';
    } else {
        for (var i = 0; i < room_names.length; i++) {
            option += '<option value="' + room_names[i] + '">' + room_names[i] + '</option>';
        }
    }
    var room_select = $('#room_select');
    room_select.html(option);
    if (room_names.length > 0) {
        room_select.val(room_names[0]);
    }
    room_select.attr("size", room_names.length);
    room_select.change();
}

function room_set_players(jquery_div_container, players) {
    var players_html = '';
    players_html += "<table><tbody>";
    for (var i = 0; i < players.length; ++i) {
        players_html += "<tr>";
        players_html += "<td>";
        // players_html += '<span id="ui_player_' + players[i] + '" class="ui_player_name">' + players[i] + '</span>';
        players_html += '<span id="ui_player_' + players[i] + '" class="ui_player_name">' + players[i] + '</span>';
        players_html += "</td>";
        players_html += "<td>";
        players_html += '<span id="ui_player_' + players[i] + '_score" class="ui_player_name"></span>';
        players_html += "</td>";
        players_html += "</tr>";
    }
    players_html += "</tbody></table>";
    jquery_div_container.html(players_html);
}

function room_set_players_words_pending(jquery_div_container, players, players_pending) {
    var players_html = '';
    var changed = 0;
    for (var i = 0; i < players.length; ++i) {
        var span = $('#ui_player_' + players[i]);
        if (players_pending.indexOf(players[i]) > -1) {
            if (!changed && span != undefined) {
                span.removeClass("ui_player_turn");
                span.removeClass("ui_player_words_ready");
                span.addClass("ui_player_words_pending");
            } else {
                changed = 1;
            }
            players_html += '<span id="ui_player_' + players[i] + '" class="ui_player_name ui_player_words_pending">' + players[i] + '</span>';
        } else {
            if (!changed && span != undefined) {
                span.removeClass("ui_player_turn");
                span.removeClass("ui_player_words_pending");
                span.addClass("ui_player_words_ready");
            } else {
                changed = 1;
            }
            players_html += '<span id="ui_player_' + players[i] + '" class="ui_player_name ui_player_words_ready">' + players[i] + '</span>';
        }
    }
    if (changed) {
        jquery_div_container.html(players_html);
    }
}

function room_set_players_turn(players, turn_player, scores) {
    for (var i = 0; i < players.length; ++i) {
        var span = $('#ui_player_' + players[i]);
        var span_score = $('#ui_player_' + players[i] + '_score');
        if (players[i] === turn_player) {
            if (span != undefined) {
                span.removeClass("ui_player_words_ready");
                span.removeClass(" ui_player_words_pending");
                span.addClass("ui_player_turn");
            }
            // span.text(players[i] + ' guessed ' + scores[i]);
        } else {
            if (span != undefined) {
                span.removeClass("ui_player_words_ready");
                span.removeClass(" ui_player_words_pending");
                span.removeClass("ui_player_turn");
            }
            //players_html += '<span id="ui_player_' + players[i] + '" class="ui_player_name">' + players[i] + ' guessed ' + scores[i] + '</span>';
        }
        span_score.text(scores[i]);
    }
}

function room_set_players_situp(jquery_div_container, players) {
    var players_html = '';
    var radius = 50;
    for (var i = 0; i < players.length; ++i) {
        var x = radius + radius * Math.cos(i * 2 * Math.PI / players.length);
        var y = radius + radius * Math.sin(i * 2 * Math.PI / players.length);
        var style = 'style="left:' + x + 'px;top:' + y + 'px;"';
        log(style);
        players_html += '<span class="situp" ' + style + '>' + players[i] + '</span>';
    }
    jquery_div_container.html(players_html);
}

function show_word_info(word, time_to_guess, author) {
    $(".last_word_holder").show();
    get_last_word_word().text(word);
    var time = time_to_guess/1000;
    if (time > 5) {
        time = Math.round(time + 0.5);
    }
    get_last_word_time().text(time);
    get_last_word_author().text(author);
}

/* Game functions */
function enter_new_game() {
    log('Entering new game');
    set_ui_layout(const_ui_state_word_gen);
    /* store game state info into cookie */
}

function hatgame_start_new_game() {
    ws_request_start_game(state_room_name, state_room_pass, state_player_name);
}

/* Word generation functions */
function hatgame_submit_words(jqueryElement) {
    log(jqueryElement.val());

    var submit_button = $('#ui_submit_words_button');
    submit_button.prop('disabled', true);
    setTimeout(function () {
        submit_button.prop('disabled', false);
    }, 1000);

    var linesRaw = jqueryElement.val().split("\n");
    var lines = [];
    var i;
    for (i = 0; i < linesRaw.length; ++i) {
        var line = linesRaw[i].trim();
        if (line != undefined && line.length > 0) {
            lines.push(line);
        }
    }
    if (lines.length < state_words_per_player) {
        post_message("Need more words (" + (state_words_per_player - lines.length) + ")");
        return;
    } else if (lines.length > state_words_per_player) {
        post_message("Too many words (" + lines.length + ")");
        return;
    }
    for (i = 0; i < lines.length; ++i) {
        lines[i] = lines[i].trim();
    }
    ws_request_commit_words(state_room_name, state_room_pass, state_player_name, lines);
    submit_button.hide();
    //post_message("Words sent. Awaiting other players...");
}

function enter_turn_my() {
    get_turn_timer().text(state_turn_time_sec + " Seconds");
    $('#done_words_holder').html('');
    state_words_done = [];
    set_ui_layout(const_ui_state_turn_me);
}
function enter_turn_other() {
    set_ui_layout(const_ui_state_turn_other);
}
function enter_turn_stage() {
    if (state_turn_name === state_player_name) {
        enter_turn_my();
    } else {
        if (state_turn_name === partner(state_player_name)) {
            $('#ui_other_turn_correction').text("Your partner");
        } else {
            $('#ui_other_turn_correction').text("Others");
        }
        enter_turn_other();
    }
}

function fetch_next_word() {
    if (state_words_for_turn.length > 0) {
        get_word().text(state_words_for_turn.shift());
        state_last_word_time = new Date().getTime();
    } else {
        stopTimer();
        if (turn_active) {
            turn_active = false;
            hatgame_end_turn();
        }
    }
}
/**
 * Receive first word, and start timer countdown.
 * Sets callback on timeout, to clean up UI and send turn results to server
 */
function hatgame_start_turn() {
    log('Start my turn');
    turn_active = true;
    turn_timed_out = false;
    activateTimer(state_turn_time_sec);
    setTimeout(function () {
        stopTimer();
        if (turn_active) {
            turn_active = false;
            turn_timed_out = true;
            hatgame_end_turn();
        }
    }, state_turn_time_sec * 1000);
    get_turn_me_pre().hide();
    get_turn_me_active().show();
    fetch_next_word();
}

function hatgame_next_word() {
    reroll_available = false;

    var cur_word = get_word().text();
    state_words_done.push(cur_word);
    log(state_words_done);

    var time = new Date().getTime() - state_last_word_time;
    ws_request_word_info(cur_word, time, false);

    $('#done_words_holder').append(' <span class="word_tile">' + cur_word + '</span>');
    $('#ui_button_next_word').attr("disabled", true).addClass("disabled");

    setTimeout(function () {
        $('#ui_button_next_word').attr("disabled", false).removeClass("disabled");
    }, 800);
    fetch_next_word();
}

function hatgame_end_turn() {
    //if there are remaining words in game
    if (turn_timed_out) {
        //send last word time, even though it was not guessed
        var time = new Date().getTime() - state_last_word_time;
        ws_request_word_info(get_word().text(), time, true);
    }

    /* send turn results */
    get_turn_me_active().hide();
    //state_turn_num++;

    //not used anymore, each word is submitted individually
    // ws_request_commit_turn(state_room_name, state_room_pass, state_player_name, state_words_done, state_turn_num);
}

function hatgame_reroll_situp() {
    ws_request_reroll_situp();
}

function enter_gameend() {
    reroll_available = true;
    state_turn_num = 0;
    set_ui_layout(const_ui_state_endgame);
}

function start_screen() {
    set_ui_layout(const_ui_state_no_room);
}

function no_room_to_in_room() {
    room_enter(state_room_name, state_room_pass, state_player_name, state_words_per_player, state_turn_time_sec);
}
function no_room_to_word_generation() {
    enter_new_game();
}
function no_room_to_hatgame() {
    enter_turn_stage();
}
function in_room_to_in_room() {
    //player list is updated by itself
}
function in_room_to_word_generation() {
    enter_new_game();
}
function word_generation_to_word_generation() {
    //player list is updated by itself
}
function word_generation_to_hatgame() {
    enter_turn_stage();
}
function hatgame_to_hatgame() {
    enter_turn_stage();
}
function hatgame_to_endgame() {
    enter_gameend();
}
function endgame_to_no_room() {
    start_screen();
}

var transitions = {
    "no_room": {
        "in_room": no_room_to_in_room,
        "word_generation": no_room_to_word_generation,
        "hatgame": no_room_to_hatgame
    },
    "in_room": {
        "in_room": in_room_to_in_room,
        "word_generation": in_room_to_word_generation
    },
    "word_generation": {
        "word_generation": word_generation_to_word_generation,
        "hatgame": word_generation_to_hatgame
    },
    "hatgame": {
        "hatgame": hatgame_to_hatgame,
        "endgame": hatgame_to_endgame
    },
    "endgame": {
        "no_room": endgame_to_no_room
    }
};

function transitionTo(state) {
    var possible_transitions = transitions[state_state];
    if (possible_transitions != undefined) {
        var transition_func = possible_transitions[state];
        if (transition_func != undefined) {
            log("Found transition " + state_state + "->" + state);
            set_state(state);
            transition_func();
            return;
        }
    }
    log("No transition " + state_state + "->" + state);
}

function handle_ws_rooms(data) {
    var json = JSON.parse(data);
    if (json["action"] === "room_list") {
        log('handle_ws_rooms');
        var room_info = json["data"];
        var room_names = [];
        $.each(room_info, function (room_name) {
            room_names.push(room_name);
        });
        set_found_rooms(room_names);
        //closeSocket();
        debug_state();
    }
}

function handle_ws_in_room(data) {
    var json = JSON.parse(data);
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "in_room") {
        log('handle_ws_in_room');
        var players = json["data"]["players"];
        room_set_players($('#players_list'), players);

        set_room_name(json["room_name"]);
        set_words_per_player(json["data"]["words"]);
        set_turn_time_sec(json["data"]["turn_time"]);

        transitionTo(state);
        debug_state();
    }
}

function handle_ws_word_generation(data) {
    var json = JSON.parse(data);
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "word_generation") {
        log('handle_ws_word_generation');
        var players = json["data"]["players"];
        var words_players = json["data"]["words_pending_from"];
        room_set_players_words_pending($('#players_list'), players, words_players);

        transitionTo(state);
        debug_state();
    }
}

function handle_ws_hatgame(data) {
    var json = JSON.parse(data);
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "hatgame") {
        log('handle_ws_hatgame');
        state_turn_num++;
        if (state_turn_num > 1) {
            reroll_available = false;
        }
        var players = json["data"]["players"];
        var turn_player = json["data"]["turn_player"];
        var scores = json["data"]["scores"];
        var words_remaining = json["data"]["words_remaining"];
        var player_name_container = $('#players_list');
        room_set_players(player_name_container, players);
        room_set_players_turn(players, turn_player, scores);
        var situp_schema = json["data"]["situp"];
        room_set_players_situp($('#situp'), situp_schema);

        set_situp(situp_schema);
        state_words_for_turn = json["data"]["turn_words"];
        set_turn_name(turn_player);

        transitionTo(state);
        debug_state();
    }
}

function handle_ws_endgame(data) {
    var json = JSON.parse(data);
    var room_name = json["room_name"];
    var state = json["state"];
    if (state === "endgame") {
        log('handle_ws_endgame');
        var players = json["data"]["players"];
        var scores = json["data"]["scores"];
        room_set_players_turn(players, '', scores);
        room_set_players_situp($('#situp'), json["data"]["situp"]);
        transitionTo(state);
        debug_state();
    }
}

function handle_ws_set_name(data) {
    var json = JSON.parse(data);
    var action = json["action"];
    if (action === "set_name") {
        log('handle_ws_set_name');
        var success = json["success"];
        var player_name = json["player_name"];
        if (success) {
            set_player_name(player_name);
            set_ui_layout(const_ui_state_no_room);
        } else {
            post_message("Name already taken");
        }
    }
}

function handle_ws_word_info(raw_data) {
    var json = JSON.parse(raw_data);
    var action = json["action"];
    if (action === "word_info") {
        log('handle_ws_word_info');
        var data = json["data"];
        var word = data["word"];
        var time = data["time"];
        var author = data["author"];
        show_word_info(word, time, author);

        var turn_player_score_span = $('#ui_player_' + state_turn_name + '_score');
        turn_player_score_span.text(parseInt(turn_player_score_span.text()) + 1);
    }
}

function handle_ws_reroll(raw_data) {
    var json = JSON.parse(raw_data);
    var action = json["action"];
    if (action === "reroll_team") {
        log('handle_ws_word_info');
        var data = json["data"];
        var situp_schema = data["new_situp"];
        room_set_players_situp($('#situp'), situp_schema);
    }
}

/* UI configs */
function set_ui_state_pre_room() {
    log('set pre_room layout');
    $('#room_find').addClass('leftfloat ribbed-grayLight').show();
    $('#room_create_enter').addClass('maintab').show();
    $('#room_info').hide();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').hide();
    $('#game_aftermath').hide();
    $('#situp').html(''); //clear situp schema
    $('#room_enter_player_name').hide();
    $(".last_word_holder").hide(); //hide last word holders

    $('#room_name').val(Cookies.get('ht_room_name'));
    $('#room_pass').val(Cookies.get('ht_room_pass'));
    $('#player_name').val(Cookies.get('ht_player_name'));
    $('#hatgame_word_per_player').val(Cookies.get('ht_wpp'));
    $('#hatgame_seconds_per_turn').val(Cookies.get('ht_tts'));
}
function set_ui_state_in_room() {
    log('set in_room layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').addClass('maintab').show();
    $('#game_word_enter').hide();
    $('#game_turn').hide();
    $('#game_aftermath').hide();
    $('#room_enter_player_name').hide();
}
function set_ui_state_word_gen() {
    log('set word_gen layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').hide();
    $('#game_word_enter').addClass('maintab').show();
    $('#word_enter').val('');
    $('#game_turn').hide();
    $('#game_aftermath').hide();
    $('#room_enter_player_name').hide();

    $('#ui_submit_words_button').show(); //show button
}
function set_ui_state_turn_other() {
    log('set turn_other layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').show();
    $('#hatgame_turn_other').addClass('maintab').show();
    $('#hatgame_turn_me').hide();
    $('#game_aftermath').hide();
    $('#room_enter_player_name').hide();
}
function set_ui_state_turn_me() {
    log('set turn_my layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').show();
    $('#hatgame_turn_other').hide();
    $('#hatgame_turn_me').addClass('maintab').show();
    get_turn_me_pre().show();
    get_turn_me_active().hide();
    $('#game_aftermath').hide();
    $('#room_enter_player_name').hide();
    if (reroll_available) {
        $('#hatgame_turn_me_reroll').show();
    } else {
        $('#hatgame_turn_me_reroll').hide();
    }
}
function set_ui_state_endgame() {
    log('set endgame layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').addClass('leftfloat').show();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').hide();
    $('#game_aftermath').addClass('maintab').show();
    $('#room_enter_player_name').hide();
}

function set_ui_state_player_name() {
    log('set player name layout');
    $('#room_find').hide();
    $('#room_create_enter').hide();
    $('#room_info').hide();
    $('#room_inroom').hide();
    $('#game_word_enter').hide();
    $('#game_turn').hide();
    $('#game_aftermath').hide();
    $('#room_enter_player_name').addClass('maintab').show();
}

function set_ui_layout(layout) {
    log('set layout to ' + layout);
    switch (layout) {
        case const_ui_state_no_room:
            set_ui_state_pre_room();
            break;
        case const_ui_state_in_room:
            set_ui_state_in_room();
            break;
        case const_ui_state_word_gen:
            set_ui_state_word_gen();
            break;
        case const_ui_state_turn_other:
            set_ui_state_turn_other();
            break;
        case const_ui_state_turn_me:
            set_ui_state_turn_me();
            break;
        case const_ui_state_endgame:
            set_ui_state_endgame();
            break;
        case const_ui_state_player_name:
            set_ui_state_player_name();
            break;
        default:
            log('UNKNOWN LAYOUT ' + layout);
    }
}

function reset() {
    transitionTo("no_room");
}

function init() {
    //var startingLayout = const_ui_state_word_gen;
    set_ui_layout(const_ui_state_player_name);
    $('#infobox').hide();

    set_state('no_room');
    set_room_name(get_or_default(Cookies.get('ht_room_name'), 'hatroom'));
    set_room_password(get_or_default(Cookies.get('ht_room_pass'), 'hatpass'));
    set_words_per_player(get_or_default(Cookies.get('ht_wpp'), '20'));
    set_turn_time_sec(get_or_default(Cookies.get('ht_tts'), '20'));

    // var stored_name = Cookies.get('ht_player_name');
    // if (!stored_name || stored_name === '') {
    //     set_ui_layout(const_ui_state_player_name);
    // } else {
    //     set_player_name(stored_name);
    // }

    set_turn_name('');

    var saved_backend = Cookies.get('ht_wsbe');
    if (!saved_backend || saved_backend === '' || saved_backend === 'undefined') {
        saved_backend = 'ws://139.59.136.7:8888/ws';
    }
    set_backend(saved_backend);


    ws_add_handler(handle_ws_rooms);
    ws_add_handler(handle_ws_in_room);
    ws_add_handler(handle_ws_word_generation);
    ws_add_handler(handle_ws_hatgame);
    ws_add_handler(handle_ws_endgame);
    ws_add_handler(handle_ws_set_name);
    ws_add_handler(handle_ws_word_info);
    ws_add_handler(handle_ws_reroll);
    connect();
}

$(document).ready(function () {
    log("Page loaded");
    init();
    log("State intialized");
});