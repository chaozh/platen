angular.module('platen.services').factory('storage', function() {

    return {
        get: function(key, callback) {
            if(!angular.isUndefined(chrome) && chrome.storage) {
                chrome.storage.local.get(key, function (storedValues) {
                        callback(storedValues[key]);
                });
            } else {
                var tmp =  window.localStorage.getItem(key);
                callback(JSON.parse(tmp));
            }
        },

        set: function(key, value, callback, obj){
            var tmp = obj || {};
            if(!angular.isUndefined(chrome) && chrome.storage) {
                tmp[key] = value;
                chrome.storage.local.set(tmp, callback);
            } else {
                tmp = JSON.stringify(value);
                window.localStorage.setItem(key, tmp);
                callback();
            }
        }
    };
});