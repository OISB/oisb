(() => {
    var options;
    var logging;
    
    class TooManyActors extends Error {
        constructor() {
            super(...arguments);

            this.name = this.constructor.name;
        }
    }
    
    class Cast extends require("events").EventEmitter {
        constructor() {
            super();
            
            this.actors = [];
        }
        
        add(actor) {
            logging.log("cast.add: actor(" + actor.id + ")");
        
            this.actors.push(actor);
            
            this.emit("add", actor);
        }
        
        find(id) {
            var actor = this.actors.find(a => a.id == id);
            
            if (actor)
                return actor;
            
            return null;
        }
        
        drop(actor) {
            logging.log("cast.drop: actor(" + actor.id + ")");
        
            this.actors = this.actors.filter(a => a != actor);
        }
        
        ping() {
            if (this.actors.length)
                logging.log("cast.ping: pinging " + this.actors.length + " actors");
            
            for (var actor of this.actors)
                actor.ping();
        }
        
        random_id() {
            var id;
            
            var digits = [
                "a", "b", "c", "d", "f", "g", "i", "k", "n", "o",
                "p", "q", "r", "s", "t", "u", "w", "x", "y", "z"
            ];
            
            if (this.actors.length > 160000)
                throw new TooManyActors("Risk of inf. loop");
            
            do
                id = Array(8).fill(0).map(x => digits[Math.random() * 20 | 0]).join("");
            while (this.actors.some(a => a.id == id));
            
            return id;
        }
    }
    
    module.exports = {
        init: (options_, logging_) => {
            options = options_;
            logging = logging_;
            
            return new Cast();
        }
    };
})();