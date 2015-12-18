define(['html!bower_components/paper-spinner/paper-spinner', 'css!components/loading/loading'], function () {

    return {
        show: function () {
            var elem = document.querySelector('.docspinner');

            if (!elem) {

                elem = document.createElement("paper-spinner");
                elem.classList.add('docspinner');

                document.body.appendChild(elem);
            }

            elem.active = true;
            elem.style.display = 'block';
        },
        hide: function () {
            var elem = document.querySelector('.docspinner');

            if (elem) {

                elem.active = false;
                elem.style.display = 'none';
            }
        }
    };
});