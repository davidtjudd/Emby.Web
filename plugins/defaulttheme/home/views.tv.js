(function (globalScope) {

    function loadResume(element, parentId, apiClient) {

        var options = {

            SortBy: "DatePlayed",
            SortOrder: "Descending",
            IncludeItemTypes: "Episode",
            Filters: "IsResumable",
            Limit: 6,
            Recursive: true,
            Fields: "PrimaryImageAspectRatio",
            ExcludeLocationTypes: "Virtual",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        apiClient.getItems(apiClient.getCurrentUserId(), options).done(function (result) {

            var section = element.querySelector('.resumeSection');

            DefaultTheme.CardBuilder.buildCards(result.Items, apiClient, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdropCard homebackdropCard',
                rows: 3,
                width: DefaultTheme.CardBuilder.homeThumbWidth,
                preferThumb: true,
                showTitle: true,
                hiddenTitle: true,
                addImageData: true
            });
        });
    }

    function loadNextUp(element, parentId, apiClient) {

        var options = {

            Limit: 18,
            Fields: "PrimaryImageAspectRatio,SeriesInfo,DateCreated,SyncInfo",
            UserId: apiClient.getCurrentUserId(),
            ExcludeLocationTypes: "Virtual",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            ParentId: parentId
        };

        apiClient.getNextUpEpisodes(options).done(function (result) {

            var section = element.querySelector('.nextUpSection');

            DefaultTheme.CardBuilder.buildCards(result.Items, apiClient, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdropCard homebackdropCard',
                rows: 3,
                width: DefaultTheme.CardBuilder.homeThumbWidth,
                preferThumb: true,
                showTitle: true,
                hiddenTitle: true,
                addImageData: true
            });
        });
    }

    function loadLatest(element, parentId, apiClient) {

        var options = {

            IncludeItemTypes: "Episode",
            Limit: 9,
            Fields: "PrimaryImageAspectRatio",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        apiClient.getJSON(apiClient.getUrl('Users/' + apiClient.getCurrentUserId() + '/Items/Latest', options)).done(function (result) {

            var section = element.querySelector('.latestSection');

            DefaultTheme.CardBuilder.buildCards(result, apiClient, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'backdropCard homebackdropCard',
                rows: 3,
                width: DefaultTheme.CardBuilder.homeThumbWidth,
                preferThumb: true,
                showGroupCount: true
            });
        });
    }

    function loadSpotlight(element, parentId, apiClient) {

        var options = {

            SortBy: "Random",
            IncludeItemTypes: "Series",
            Limit: 20,
            Recursive: true,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Backdrop",
            ImageTypes: "Backdrop"
        };

        apiClient.getItems(apiClient.getCurrentUserId(), options).done(function (result) {

            var card = element.querySelector('.homebackdropSpotlightCard');

            require([Emby.PluginManager.mapRequire('defaulttheme', 'home/spotlight')], function () {

                new DefaultTheme.spotlight(card, result.Items, DefaultTheme.CardBuilder.homeThumbWidth * 2, apiClient);
            });
        });
    }

    function view(element, parentId) {

        var self = this;

        require(['connectionManager'], function (connectionManager) {

            var apiClient = connectionManager.currentApiClient();

            loadResume(element, parentId, apiClient);
            loadNextUp(element, parentId, apiClient);
            loadLatest(element, parentId, apiClient);
            loadSpotlight(element, parentId, apiClient);
        });

        self.destroy = function () {

        };

        bindFlipEvents(element.querySelector('.nextUpSection'));
        bindFlipEvents(element.querySelector('.resumeSection'));
    }

    function bindFlipEvents(element) {

        element.addEventListener('focusin', function (e) {

            var card = findParent(e.target, 'card');

            if (card) {
                startCardFlipTimer(card);
            }
        });
    }

    var cardFlipTimer;
    function startCardFlipTimer(card) {

        if (cardFlipTimer) {
            clearTimeout(cardFlipTimer);
            cardFlipTimer = null;
        }

        if (card.querySelector('.cardRevealContent')) {
            // Already flipped
            return;
        }

        // It doesn't have an image
        if (!card.querySelector('.primaryImageTag')) {
            return;
        }

        cardFlipTimer = setTimeout(function () {
            flipCard(card);
        }, 1200);
    }

    function flipCard(card) {

        if (document.activeElement != card) {
            return;
        }

        if (card.querySelector('.cardRevealContent')) {
            // Already flipped
            return;
        }

        require(['connectionManager'], function (connectionManager) {

            var apiClient = connectionManager.currentApiClient();

            // Also cancel if not in document

            var cardImageContainer = card.querySelector('.cardImageContainer');

            var newCardImageContainer = document.createElement('div');
            newCardImageContainer.className = cardImageContainer.className;
            newCardImageContainer.classList.add('cardRevealContent');

            var imgUrl = apiClient.getScaledImageUrl(card.getAttribute('data-id'), {
                tag: card.querySelector('.primaryImageTag').value,
                type: 'Primary',
                width: 400
            });

            newCardImageContainer.style.backgroundImage = "url('" + imgUrl + "')";
            newCardImageContainer.classList.add('hide');
            cardImageContainer.parentNode.appendChild(newCardImageContainer);

            flipElementWithDuration(card, 600, function () {
                newCardImageContainer.classList.remove('hide');

                var hiddenTitle = card.querySelector('.hiddenTitle');
                if (hiddenTitle) {
                    hiddenTitle.classList.remove('hide');
                }

                setTimeout(function () {
                    newCardImageContainer.parentNode.removeChild(newCardImageContainer);

                    if (hiddenTitle) {
                        hiddenTitle.classList.add('hide');
                    }
                }, 4000);
            });
        });
    }

    function findParent(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function flipElementWithDuration(elem, duration, callback) {

        // Switch to SequenceEffect once that api is a little more mature
        var keyframes = [
          { transform: 'perspective(400px) ', offset: 0 },
          { transform: 'perspective(400px) rotate3d(0, 1, 0, -180deg)', offset: 1 }];

        var timing = { duration: duration, iterations: 1, easing: 'ease-in' };
        elem.animate(keyframes, timing).onfinish = function () {
            callback();
        };
    }

    if (!globalScope.DefaultTheme) {
        globalScope.DefaultTheme = {};
    }

    globalScope.DefaultTheme.tvView = view;

})(this);