(() => {
    var n_ws = require("ws");
    
    var Conn;
    
    var options;
    var logging;
    
    class CouldNotStart extends Error {
        constructor() {
            super(...arguments);

            this.name = this.constructor.name;
        }
    }
    
    class WS extends require("events").EventEmitter {
        constructor() {
            super();
            
            this.wss = null;
            this.status = -1;
        }
        
        start() {
            if (this.status != -1)
                throw new CouldNotStart(["WS is starting", "WS is running", "WS is still closing"][this.status]);
            
            var wss = new n_ws.Server({
                port: options.port == null ? 8080 : options.port,
                host: options.host == null ? "0.0.0.0" : options.port,
                ...(options.max_payload == null ? {
                    maxPayload: options.max_payload
                } : {})
            });
            
            logging.log("ws.start: starting wss on port " + (options.port == null ? 8080 : options.port));

            this.wss = wss;
            this.status = 0;

            wss.on("listening", () => {
                this.status = 1;
                
                this.emit("start");
                
                logging.log("ws.on(start): running");
            });

            wss.on("connection", (wss_conn) => {
                logging.log("ws.on(conn)");
                
                this.emit("conn", new Conn(wss_conn));
            });

            wss.on("error", (info) => {
                logging.log("ws.start.on(throw): " + info);
                
                if (this.status == 0) {
                    this.emit("fail");
                    
                    return;
                }

                if (this.status == 1) {
                    this.status = 2;

                    this.close();
                }
            });

            wss.on("close", () => {
                logging.log("ws.start.on(close)");
                
                if (this.status == 1) {
                    this.status = 2;
                    
                    this.emit("fail");
                }
                
                this.emit("close");
            });

            this.on("close", () => {
                this.wss = null;
                this.status = -1;
            });
        }
        
        async start_promise(...options) {
            if (this.status != -1)
                throw new CouldNotStart("Not in WAITING status; currently " + this.status + " (" + ["STARTING", "RUNNING", "CLOSING"][this.status] + ")");
            
            return new Promise((r_start, r_fail) => {
                var start, fail;
                
                this.on("start", start = () => {
                    this.off("start", start);
                    this.off("fail", fail);
                    
                    r_start();
                });
                
                this.on("fail", fail = () => {
                    this.off("start", start);
                    this.off("fail", fail);
                    
                    r_fail();
                });
                
                this.start(...options);
            });
        }
    }
    
    module.exports = {
        init: async (Conn_, options_, logging_) => {
            Conn = Conn_;
            
            options = options_;
            logging = logging_;
            
            var ws = new WS();
            
            for (var i = 100; i <= 12800; i *= 2) {
                try {
                    logging.log("ws.init: starting...");
                    
                    await ws.start_promise();

                    break;
                } catch (info) {
                    await new Promise((r) => setTimeout(r, i));

                    continue;
                }
            }

            if (ws.status != 1)
                throw new CouldNotStart("Could not start WS");
            
            return ws;
        }
    };
})();
