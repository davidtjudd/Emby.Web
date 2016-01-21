define(['paperdialoghelper', 'inputmanager', 'css!components/slideshow/style', 'inputmanager'], function (paperdialoghelper, inputmanager) {

    function slideshow(options) {

        var self = this;

        function createElements(options) {

            var elem = document.querySelector('.slideshowDialog');

            if (elem) {
                return elem;
            }

            var dlg = paperdialoghelper.createDialog({
                exitAnimationDuration: 800
            });

            dlg.classList.add('slideshowDialog');

            var html = '';
            html += '<div class="dialogContent">';
            html += '<div class="slideshowImage"></div><h1 class="slideshowImageText"></h1>';

            if (options.interactive) {
                html += '<paper-icon-button icon="close" class="btnSlideshowExit"></paper-icon-button>';

                html += '<div class="slideshowControlBar">';
                html += '<paper-icon-button icon="arrow-back" class="btnSlideshowPrevious largeIcon"></paper-icon-button>';
                html += '<paper-icon-button icon="arrow-forward" class="btnSlideshowNext largeIcon"></paper-icon-button>';
                html += '</div>';
            }

            html += '</div>';

            dlg.innerHTML = html;

            if (options.interactive) {
                dlg.querySelector('.btnSlideshowExit').addEventListener('click', function (e) {

                    paperdialoghelper.close(dlg);
                });
                dlg.querySelector('.btnSlideshowNext').addEventListener('click', nextImage);
                dlg.querySelector('.btnSlideshowPrevious').addEventListener('click', previousImage);
            }

            document.body.appendChild(dlg);

            paperdialoghelper.open(dlg).then(function () {

                stopInterval();
                dlg.parentNode.removeChild(dlg);
            });


            inputmanager.on(window, onInputCommand);

            dlg.addEventListener('iron-overlay-closed', onDialogClosed);

            return dlg;
        }

        function previousImage() {
            stopInterval();
            showNextImage(currentIndex - 1);
        }

        function nextImage() {
            stopInterval();
            showNextImage(currentIndex + 1);
        }

        function onDialogClosed() {
            inputmanager.off(window, onInputCommand);
        }

        var currentTimeout;
        var currentIntervalMs;
        var currentOptions;
        var currentIndex;

        function startInterval(options) {

            currentOptions = options;

            stopInterval();
            createElements(options);

            currentIntervalMs = options.interval || 6000;
            showNextImage(options.startIndex || 0, true);
        }

        function showNextImage(index, skipPreload) {

            index = Math.max(0, index);
            if (index >= currentOptions.items.length) {
                index = 0;
            }
            currentIndex = index;

            var options = currentOptions;
            var items = options.items;
            var item = items[index];
            var imgUrl;

            if (item.BackdropImageTags && item.BackdropImageTags.length) {
                imgUrl = Emby.Models.backdropImageUrl(item, {
                    maxWidth: screen.availWidth
                });
            } else {
                imgUrl = Emby.Models.imageUrl(item, {
                    type: "Primary",
                    maxWidth: screen.availWidth
                });
            }

            var onSrcLoaded = function () {
                var cardImageContainer = document.querySelector('.slideshowImage');

                var newCardImageContainer = document.createElement('div');
                newCardImageContainer.className = cardImageContainer.className;

                if (options.cover) {
                    newCardImageContainer.classList.add('cover');
                }

                newCardImageContainer.style.backgroundImage = "url('" + imgUrl + "')";
                newCardImageContainer.classList.add('hide');
                cardImageContainer.parentNode.appendChild(newCardImageContainer);

                if (options.showTitle) {
                    document.querySelector('.slideshowImageText').innerHTML = item.Name;
                } else {
                    document.querySelector('.slideshowImageText').innerHTML = '';
                }

                newCardImageContainer.classList.remove('hide');
                var onAnimationFinished = function () {

                    var parentNode = cardImageContainer.parentNode;
                    if (parentNode) {
                        parentNode.removeChild(cardImageContainer);
                    }
                };

                if (newCardImageContainer.animate) {

                    var keyframes = [
                            { opacity: '0', offset: 0 },
                            { opacity: '1', offset: 1 }];
                    var timing = { duration: 1200, iterations: 1 };
                    newCardImageContainer.animate(keyframes, timing).onfinish = onAnimationFinished;
                } else {
                    onAnimationFinished();
                }

                stopInterval();
                currentTimeout = setTimeout(function () {
                    showNextImage(index + 1, true);

                }, currentIntervalMs);
            };

            if (!skipPreload) {
                var img = new Image();
                img.onload = onSrcLoaded;
                img.src = imgUrl;
            } else {
                onSrcLoaded();
            }
        }

        function stopInterval() {
            if (currentTimeout) {
                clearTimeout(currentTimeout);
                currentTimeout = null;
            }
        }

        function onInputCommand(e) {

            switch (e.detail.command) {

                case 'left':
                    previousImage();
                    break;
                case 'right':
                    nextImage();
                    break;
                default:
                    break;
            }
        }

        self.show = function () {
            startInterval(options);
        };

        self.hide = function () {

            var dlg = document.querySelector('.slideshowDialog');
            if (dlg) {

                paperdialoghelper.close(dlg);
            }
        };
    }

    return slideshow;
});