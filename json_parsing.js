(() => {
    var options;
    var logging;
    
    var json = {};
    
    json.input = (input) => input;
    json.output = (output) => output;
    
    module.exports = {
        init: (options_, logging_) => {
            options = options_;
            logging = logging_;
            
            return json;
        }
    };
})();