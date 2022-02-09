(() => {
    var options;
    var logging;
    
    class Actor extends require("events").EventEmitter {
        constructor(cast) {
            super();
            
            this.id = cast.random_id();
            
            logging.log("actor.constructor: id: " + this.id);
            
            this.cast = cast;
            
            this.conns = [];
            
            this.ping_stamp = Date.now();
            this.pong_stamp = Date.now();
            
            cast.add(this);
        }
        
        attach(conn) {
            this.conns.push(conn);
            
            logging.log("actor(" + this.id + ").attach");
            
            conn.on("data", (data) => this.data(data));
            conn.on("pong", () => this.pong());
            
            conn.on("close", () => {
                this.conns = this.conns.filter(c => c != conn);
            });
        }
        
        data(data) {
            logging.log("actor(" + this.id + ").data: " + JSON.stringify(data));
        
            switch (data.action) {
                case "run":
                    this.emit("run", data.data, (status) => this.notify({
                        action: "run",
                        data: {
                            status: status
                        }
                    }));

                    break;
                case "stop":
                    this.emit("stop", (status) => this.notify({
                        action: "stop",
                        data: {
                            status: status
                        }
                    }));

                    break;
            }
        }
        
        notify(data) {
            logging.log("actor(" + this.id + ").notify: " + JSON.stringify(data));
            
            for (var conn of this.conns)
                conn.notify(data);
        }
        
        ping(confirm = true) {
            var now = Date.now();
            
            for (var conn of this.conns)
                conn.ping();
            
            this.ping_stamp = now;
            
            if (confirm)
                setTimeout(this.ping_confirm, options.max_ping == null ? 40000 : options.max_ping);
        }
        
        ping_confirm() {
            if (Date.now() < this.ping_stamp + (options.max_ping == null ? 40000 : options.max_ping))
                return 1;
            
            if (this.pong_stamp > this.ping_stamp)
                return 2;
            
            this.disconn(1002, "Did not pong");
            
            return 0;
        }
        
        pong() {
            var now = Date.now();
            
            this.pong_stamp = now;
            
            logging.log("actor(" + this.id + ").pong");
        }
        
        disconn(info) {
            logging.log("actor(" + this.id + ").disconn" + (info ? info + ": " : ""));
            
            for (var conn of this.conns)
                conn.close(1002, ...(info ? [info] : []));
            
            this.cast.drop(this);
        }
    }
    
    module.exports = {
        init: (options_, logging_) => {
            options = options_;
            logging = logging_;
            
            return Actor;
        }
    };
})();
