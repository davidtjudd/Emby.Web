define(['paperdialoghelper', 'inputmanager', 'css!./style', 'html!./icons', 'iron-icon-set'], function (paperdialoghelper, inputmanager) {

    return function (options) {

        var self = this;
        var swiperInstance;
        var dlg;

        function createElements(options) {

            dlg = paperdialoghelper.createDialog({
                exitAnimationDuration: 800,
                size: 'fullscreen'
            });

            dlg.classList.add('slideshowDialog');

            var html = '';

            if (options.interactive) {

                html += '<div>';
                html += '<div class="slideshowSwiperContainer"><div class="swiper-wrapper"></div></div>';

                html += '<paper-icon-button icon="slideshow:arrow-back" class="btnSlideshowExit" tabindex="-1"></paper-icon-button>';

                html += '<div class="slideshowControlBar">';
                html += '<paper-icon-button icon="slideshow:skip-previous" class="btnSlideshowPrevious slideshowButton"></paper-icon-button>';
                html += '<paper-icon-button icon="slideshow:pause" class="btnSlideshowPause slideshowButton" autoFocus></paper-icon-button>';
                html += '<paper-icon-button icon="slideshow:skip-next" class="btnSlideshowNext slideshowButton"></paper-icon-button>';
                html += '</div>';
                html += '</div>';

            } else {
                html += '<div class="slideshowImage"></div><h1 class="slideshowImageText"></h1>';
            }

            dlg.innerHTML = html;

            if (options.interactive) {
                dlg.querySelector('.btnSlideshowExit').addEventListener('click', function (e) {

                    paperdialoghelper.close(dlg);
                });
                dlg.querySelector('.btnSlideshowNext').addEventListener('click', nextImage);
                dlg.querySelector('.btnSlideshowPrevious').addEventListener('click', previousImage);
                dlg.querySelector('.btnSlideshowPause').addEventListener('click', playPause);
            }

            document.body.appendChild(dlg);

            paperdialoghelper.open(dlg).then(function () {

                stopInterval();
                dlg.parentNode.removeChild(dlg);
            });

            inputmanager.on(window, onInputCommand);

            dlg.addEventListener('iron-overlay-closed', onDialogClosed);

            if (options.interactive) {
                loadSwiper(dlg);
            }
        }

        function loadSwiper(dlg) {

            if (currentOptions.slides) {
                dlg.querySelector('.swiper-wrapper').innerHTML = currentOptions.slides.map(getSwiperSlideHtmlFromSlide).join('');
            } else {
                dlg.querySelector('.swiper-wrapper').innerHTML = currentOptions.items.map(getSwiperSlideHtmlFromItem).join('');
            }

            require(['swiper'], function (swiper) {

                swiperInstance = new Swiper(dlg.querySelector('.slideshowSwiperContainer'), {
                    // Optional parameters
                    direction: 'horizontal',
                    loop: true,
                    autoplay: options.interval || 8000,
                    // Disable preloading of all images
                    preloadImages: false,
                    // Enable lazy loading
                    lazyLoading: true,
                    autoplayDisableOnInteraction: false,
                    initialSlide: options.startIndex || 0
                });
                swiperInstance.startAutoplay();
            });
        }

        function getSwiperSlideHtmlFromItem(item) {

            return getSwiperSlideHtmlFromSlide({
                imageUrl: getImgUrl(item)
                //title: item.Name,
                //description: item.Overview
            });
        }

        function getSwiperSlideHtmlFromSlide(item) {

            var html = '';
            html += '<div class="swiper-slide">';
            html += '<img data-src="' + item.imageUrl + '" class="swiper-lazy">';
            //html += '<paper-spinner class="swiper-lazy-preloader"></paper-spinner>';
            if (item.title || item.subtitle) {
                html += '<div class="slideText">';
                html += '<div class="slideTextInner">';
                if (item.title) {
                    html += '<div class="slideTitle">';
                    html += item.title;
                    html += '</div>';
                }
                if (item.description) {
                    html += '<div class="slideSubtitle">';
                    html += item.description;
                    html += '</div>';
                }
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';

            return html;
        }

        function previousImage() {
            if (swiperInstance) {
                swiperInstance.slidePrev();
            } else {
                stopInterval();
                showNextImage(currentIndex - 1);
            }
        }

        function nextImage() {
            if (swiperInstance) {
                swiperInstance.slideNext();
            } else {
                stopInterval();
                showNextImage(currentIndex + 1);
            }
        }

        function play() {

            dlg.querySelector('.btnSlideshowPause').icon = "slideshow:pause";
            swiperInstance.startAutoplay();
        }

        function pause() {

            dlg.querySelector('.btnSlideshowPause').icon = "slideshow:play-arrow";
            swiperInstance.stopAutoplay();
        }

        function playPause() {

            var paused = dlg.querySelector('.btnSlideshowPause').icon != "slideshow:pause";
            if (paused) {
                play();
            } else {
                pause();
            }
        }

        function onDialogClosed() {

            var swiper = swiperInstance;
            if (swiper) {
                swiper.destroy(true, true);
                swiperInstance = null;
            }

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

            if (!options.interactive) {
                currentIntervalMs = options.interval || 8000;
                showNextImage(options.startIndex || 0, true);
            }
        }

        function getImgUrl(item) {

            if (item.BackdropImageTags && item.BackdropImageTags.length) {
                return Emby.Models.backdropImageUrl(item, {
                    maxWidth: screen.availWidth
                });
            } else {
                return Emby.Models.imageUrl(item, {
                    type: "Primary",
                    maxWidth: screen.availWidth
                });
            }
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
            var imgUrl = getImgUrl(item);

            var onSrcLoaded = function () {
                var cardImageContainer = dlg.querySelector('.slideshowImage');

                var newCardImageContainer = document.createElement('div');
                newCardImageContainer.className = cardImageContainer.className;

                if (options.cover) {
                    newCardImageContainer.classList.add('cover');
                }

                newCardImageContainer.style.backgroundImage = "url('" + imgUrl + "')";
                newCardImageContainer.classList.add('hide');
                cardImageContainer.parentNode.appendChild(newCardImageContainer);

                if (options.showTitle) {
                    dlg.querySelector('.slideshowImageText').innerHTML = item.Name;
                } else {
                    dlg.querySelector('.slideshowImageText').innerHTML = '';
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
                case 'play':
                    play();
                    break;
                case 'pause':
                    pause();
                    break;
                case 'playpause':
                    playPause();
                    break;
                default:
                    return
                    break;
            }

            e.preventDefault();
        }

        self.show = function () {
            startInterval(options);
        };

        self.hide = function () {

            var dialog = dlg;
            if (dialog) {

                paperdialoghelper.close(dialog);
            }
        };
    }
});