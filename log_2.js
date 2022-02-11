(() => {
    var options;
    
    class Log {
        constructor() {}
        
        log(...info) {
            console.log(this.stamp(), ...info);
        }
        
        stamp() {
            var format = (number, count = 2) => number.toString().padStart(count, 0);

            var now = new Date();

            return (
                now.getFullYear() + "-" + format(now.getMonth() + 1) + "-" + format(now.getDate()) + " " +
                format(now.getHours()) + ":" + format(now.getMinutes()) + ":" + format(now.getSeconds()) + "." + format(now.getMilliseconds(), 3) + "0"
            );
        }
    }
    
    module.exports = {
        init: (options_) => {
            options = options_;
            
            return new Log();
        }
    };
})();