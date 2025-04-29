import Handlebars from 'handlebars';

// Определяем хелпер eq
Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});