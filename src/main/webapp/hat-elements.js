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
