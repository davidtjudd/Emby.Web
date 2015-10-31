define(['paperdialoghelper'], function (paperdialoghelper) {

    return function (options) {

        if (typeof options === 'string') {
            options = {
                title: Globalize.translate('HeaderAlert'),
                text: options
            };
        }

        var message = options.text;
        var title = options.title;
        var callback = options.callback;

        var dlg = paperdialoghelper.createDialog();

        var html = '';
        html += '<div class="dialogContent">';
        html += '<h1 class="dialogTitle">' + title + '</h1>';
        html += '<div class="dialogMessage">' + message + '</div>';
        html += '<div>';

        var index = 0;

        html += options.buttons.map(function (b) {

            var buttonHtml = '<paper-button raised class="btnDialogOption block" data-index="' + index + '">' + b + '</paper-button>';
            index++;
            return buttonHtml;

        }).join('');

        html += '</div>';
        html += '</div>';

        dlg.innerHTML = html;
        document.body.appendChild(dlg);

        var activeElement = document.activeElement;
        var resultIndex = -1;

        // Has to be assigned a z-index after the call to .open() 
        dlg.addEventListener('iron-overlay-closed', function (e) {

            this.parentNode.removeChild(this);

            activeElement.focus();

            if (callback) {
                callback(resultIndex);
            }
        });

        dlg.addEventListener('click', function (e) {

            var actionSheetMenuItem = Emby.Dom.parentWithClass(e.target, 'btnDialogOption');

            if (actionSheetMenuItem) {

                resultIndex = parseInt(actionSheetMenuItem.getAttribute('data-index'));
                paperdialoghelper.close(dlg);
            }
        });

        paperdialoghelper.open(dlg);
    };
});