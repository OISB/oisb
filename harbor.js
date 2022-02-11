(() => {
    var options;
    var logging;
    
    class TooManyDocks extends Error {
        constructor() {
            super(...arguments);

            this.name = this.constructor.name;
        }
    }
    
    class Harbor extends require("events").EventEmitter {
        constructor() {
            super();
            
            this.ids = new Set();
            this.docks = [];
        }
        
        add(dock) {
            this.docks.push(dock);
            
            this.emit("add", dock);
        }
        
        drop(dock) {
            this.docks = this.docks.filter(d => d != dock);
        }
        
        push_id(id) {
            this.ids.add(id);
        }
        
        random_id() {
            var id;
            
            var digits = [
                "a", "b", "c", "d", "f", "g", "i", "k", "n", "o",
                "p", "q", "r", "s", "t", "u", "w", "x", "y", "z"
            ];
            
            if (this.ids.size > 64000000)
                throw new TooManyDocks("Risk of inf. loop");
            
            do
                id = Array(12).fill(0).map(x => digits[Math.random() * 20 | 0]).join("");
            while (this.ids.has(id));
            
            return id;
        }
    }
    
    module.events = {
        init: (options_, logging_) => {
            options = options_;
            logging = logging_;
            
            return new Harbor();
        }
    };
})();