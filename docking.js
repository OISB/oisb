(() => {
    var Dock;
    
    var options;
    var logging;
    
    class TooManyDocks extends Error {
        constructor() {
            super(...arguments);

            this.name = this.constructor.name;
        }
    }
    
    class Docking extends require("events").EventEmitter {
        constructor() {
            super();
            
            this.ids = new Set();
            this.docks = [];
        }
        
        provision() {
            logging.log("docking.provision: provisioning");
            
            return new Dock(this);
        }
        
        drop(dock) {
            logging.log("docking.drop: dropping " + ("id" in dock ? dock.id : "(no id)"));
            
            this.docks = this.docks.filter(d => d != dock);
        }
        
        provision_id() {
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
            
            this.ids.add(id);
            
            return id;
        }
    }
    
    module.exports = {
        init: (Dock_, options_, logging_) => {
            Dock = Dock_;
            
            options = options_;
            logging = logging_;
            
            return new Docking();
        }
    };
})();