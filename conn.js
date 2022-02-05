(() => {
    var options;
    var logging;
    
    class Conn extends require("events").EventEmitter {
        constructor(conn) {
            super();
            
            this.conn = conn;
            
            this.ping_stamp = Date.now();
            this.pong_stamp = Date.now();
            
            conn.on("message", (message) => {
                var data;
                
                try {
                    data = JSON.parse(message.toString());
                } catch (info) {
                    conn.close(1002, "Invalid JSON");
                    
                    logging.log("wss_conn.on(data): invalid: " + JSON.stringify(info));
                    
                    return;
                }
                
                if (data == null || !("action" in data) || typeof data.action != "string"){
                    conn.close(1002, "Invalid JSON format");
                    
                    return;
                }

                this.emit("data", data);
            });
            
            conn.on("error", (info) => {
                logging.log("wss_conn.on(throw): " + JSON.stringify(info));
                
                conn.close(1002);
            });
            
            conn.on("close", (code, reason) => {
                logging.log("wss_conn.on(close): " + code + (reason ? " (" + reason + ")" : ""));
                
                this.emit("close");
            });
            
            this.on("data", (data) => {
                if (data.action == "pong") {
                    var now = Date.now();
                    
                    this.pong_stamp = now;
                    
                    this.emit("pong");
                }
            });
        }
        
        notify(data) {
            this.conn.send(JSON.stringify(data));
        }
        
        ping(confirm = false) {
            var now = Date.now();
            
            this.notify({
                action: "ping",
                data: {
                    now: now
                }
            });
            
            this.ping_stamp = now;
            
            if (confirm)
                setTimeout(this.ping_confirm, options.max_ping == null ? 40000 : options.max_ping);
        }
        
        ping_confirm() {
            if (Date.now() < this.ping_stamp + (options.max_ping == null ? 40000 : options.max_ping))
                return 1;
            
            if (this.pong_stamp > this.ping_stamp)
                return 2;
            
            this.close(1002, "Did not pong");
            
            return 0;
        }
        
        close() {
            this.conn.close(...arguments);
        }
    }
    
    module.exports = {
        init: (options_, logging_) => {
            options = options_;
            logging = logging_;
            
            return Conn;
        }
    };
})();