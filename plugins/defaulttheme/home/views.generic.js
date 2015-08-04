(function (globalScope) {

    function loadLatest(element, parentId, apiClient) {

        var options = {

            Limit: 24,
            Fields: "PrimaryImageAspectRatio",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        apiClient.getJSON(apiClient.getUrl('Users/' + apiClient.getCurrentUserId() + '/Items/Latest', options)).done(function (result) {

            var section = element.querySelector('.latestSection');

            // Needed in case the view has been destroyed
            if (!section) {
                return;
            }

            DefaultTheme.CardBuilder.buildCards(result, apiClient, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'autoHome'
            });
        });
    }

    function view(element, parentId) {
        var self = this;

        require(['connectionManager'], function (connectionManager) {

            var apiClient = connectionManager.currentApiClient();

            loadLatest(element, parentId, apiClient);
        });

        self.destroy = function () {

        };
    }

    if (!globalScope.DefaultTheme) {
        globalScope.DefaultTheme = {};
    }

    globalScope.DefaultTheme.genericView = view;

})(this);