define(['visibleinviewport'], function (visibleinviewport) {

    var thresholdX = screen.availWidth;
    var thresholdY = screen.availHeight;

    var wheelEvent = (document.implementation.hasFeature('Event.wheel', '3.0') ? 'wheel' : 'mousewheel');

    function isVisible(elem) {
        return visibleinviewport(elem, true, thresholdX, thresholdY);
    }

    function fillImage(elem) {
        var source = elem.getAttribute('data-src');
        if (source) {
            ImageStore.setImageInto(elem, source);
            elem.setAttribute("data-src", '');
        }
    }

    function cancelAll(tokens) {
        for (var i = 0, length = tokens.length; i < length; i++) {

            tokens[i] = true;
        }
    }

    function unveilElements(images) {

        if (!images.length) {
            return;
        }

        var cancellationTokens = [];
        function unveilInternal(tokenIndex) {

            var remaining = [];
            var anyFound = false;
            var out = false;

            // TODO: This out construct assumes left to right, top to bottom

            for (var i = 0, length = images.length; i < length; i++) {

                if (cancellationTokens[tokenIndex]) {
                    return;
                }
                var img = images[i];
                if (!out && isVisible(img)) {
                    anyFound = true;
                    fillImage(img);
                } else {

                    if (anyFound) {
                        out = true;
                    }
                    remaining.push(img);
                }
            }

            images = remaining;

            if (!images.length) {
                document.removeEventListener('focus', unveil, true);
                document.removeEventListener('scroll', unveil, true);
                document.removeEventListener(wheelEvent, unveil, true);
                window.removeEventListener('resize', unveil, true);
            }
        }

        function unveil() {

            cancelAll(cancellationTokens);

            var index = cancellationTokens.length;
            cancellationTokens.length++;

            setTimeout(function () {
                unveilInternal(index);
            }, 1);
        }

        document.addEventListener('scroll', unveil, true);
        document.addEventListener('focus', unveil, true);
        document.addEventListener(wheelEvent, unveil, true);
        window.addEventListener('resize', unveil, true);

        unveil();
    }

    function fillImages(elems) {

        for (var i = 0, length = elems.length; i < length; i++) {
            var elem = elems[0];
            var source = elem.getAttribute('data-src');
            if (source) {
                ImageStore.setImageInto(elem, source);
                elem.setAttribute("data-src", '');
            }
        }
    }

    function lazyChildren(elem) {

        unveilElements(elem.getElementsByClassName('lazy'));
    }

    function lazyImage(elem, url) {

        elem.setAttribute('data-src', url);
        fillImages([elem]);
    }

    function getPrimaryImageAspectRatio(items) {

        var values = [];

        for (var i = 0, length = items.length; i < length; i++) {

            var ratio = items[i].PrimaryImageAspectRatio || 0;

            if (!ratio) {
                continue;
            }

            values[values.length] = ratio;
        }

        if (!values.length) {
            return null;
        }

        // Use the median
        values.sort(function (a, b) { return a - b; });

        var half = Math.floor(values.length / 2);

        var result;

        if (values.length % 2)
            result = values[half];
        else
            result = (values[half - 1] + values[half]) / 2.0;

        // If really close to 2:3 (poster image), just return 2:3
        var aspect2x3 = 2 / 3;
        if (Math.abs(aspect2x3 - result) <= .15) {
            return aspect2x3;
        }

        // If really close to 16:9 (episode image), just return 16:9
        var aspect16x9 = 16 / 9;
        if (Math.abs(aspect16x9 - result) <= .2) {
            return aspect16x9;
        }

        // If really close to 1 (square image), just return 1
        if (Math.abs(1 - result) <= .15) {
            return 1;
        }

        // If really close to 4:3 (poster image), just return 2:3
        var aspect4x3 = 4 / 3;
        if (Math.abs(aspect4x3 - result) <= .15) {
            return aspect4x3;
        }

        return result;
    }

    function setImageIntoElement(elem, url) {

        if (elem.tagName !== "IMG") {

            var tmp = new Image();

            tmp.onload = function () {

                elem.style.backgroundImage = "url('" + url + "')";
            };
            tmp.src = url;


        } else {
            elem.setAttribute("src", url);
        }

        //fadeIn(elem, 1);
    }

    console.log('creating simpleImageStore');
    window.ImageStore = {
        setImageInto: setImageIntoElement
    };

    if (navigator.webkitPersistentStorage) {
        require(['js/imagestore']);
    }

    return {
        lazyChildren: lazyChildren,
        getPrimaryImageAspectRatio: getPrimaryImageAspectRatio
    };

});