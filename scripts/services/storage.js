angular.module('platen.services').factory('storage', function() {
    var DEFAULT_SYSTEM = 'chrome';
    var system = chrome.storage.local;
    return {
        get: function(key, callback) {
            system.get(key, function(storedValues){
                callback(storedValues[key]);
            });
        },

        set: function(key, value, callback, obj){
            var tmp = obj || {};
            tmp[key] = value;
            system.set(tmp, callback);
        }
    }
});