var turn_timer;
function get_turn_timer() {
    if (!turn_timer) {
        turn_timer = $('#turn_timer');
    }
    return turn_timer;
}

var turn_me_pre;
function get_turn_me_pre() {
    if (!turn_me_pre) {
        turn_me_pre = $('#hatgame_turn_me_pre');
    }
    return turn_me_pre;
}

var turn_me_active;
function get_turn_me_active() {
    if (!turn_me_active) {
        turn_me_active = $('#hatgame_turn_me_active');
    }
    return turn_me_active;
}

var word;
function get_word() {
    if (!word) {
        word = $('#word');
    }
    return word;
}

var last_word_word;
function get_last_word_word() {
    if (!last_word_word) {
        last_word_word = $(".last_word_word");
    }
    return last_word_word;
}

var last_word_time;
function get_last_word_time() {
    if (!last_word_time) {
        last_word_time = $(".last_word_time");
    }
    return last_word_time;
}

var last_word_author;
function get_last_word_author() {
    if (!last_word_author) {
        last_word_author = $(".last_word_author");
    }
    return last_word_author;
}


