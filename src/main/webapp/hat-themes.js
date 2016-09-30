/**
 * Created by aielemental on 01.10.2016.
 */

var default_theme = "theme-default";

function next_theme() {
    var body = $("body");

    if (body.hasClass("theme-default")) {
        set_theme("theme-darkula");
    } else {
        set_theme("theme-default");
    }
}

function set_theme(theme) {
    var body = $("body");

    if (theme === "theme-default") {
        body.addClass("theme-default").removeClass("theme-darkula");
    } else if (theme === "theme-darkula") {
        body.addClass("theme-darkula").removeClass("theme-default");
    } else {
        return;
    }
    Cookies.set('ht_ui_theme', theme)
}

function init_theme() {
    set_theme(get_or_default(Cookies.get('ht_ui_theme'), default_theme));
}

$(document).ready(function () {
    log("Theme init");
    init_theme();
    log("Theme initialized");
});