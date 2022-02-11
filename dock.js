(() => {
    var child_process = require("child_process");

    var Child;
    
    var options;
    var logging;
    
    class Dock extends require("events").EventEmitter {
        constructor(docking) {
            super();
            
            this.docking = docking;
            
            this.id = null;
            this.child = null;
        }
        
        run(image) {
            if (this.child != null) {
                logging.log("dock(" + this.id + ").run: running");
                
                this.emit("run", -1);
            
                return;
            }
            
            try {
                this.id = this.docking.provision_id();
            
                logging.log("dock(" + this.id + ").run: " + image);

                child_process.spawn("./dock_kill", ["21", "rto_" + this.id], {
                    detached: true,
                    stdio: "ignore"
                }).unref();
                
                var args = [
                    "timeout", "--foreground", "-s", "SIGKILL", "20",
                    "docker", "run", "--rm", "-i",
                    "--runtime", (options.runtime == null ? "runsc" : options.runtime),
                    "--network", "none",
                    "--memory", "100000000",
                    "--memory-reservation", "20000000",
                    "--memory-swap", "100000000",
                    "--cpu-shares", "128",
                    "--cpus", "1.00",
                    "--name", "rto_" + this.id,
                    image
                ];

                this.child = new Child(args);
                
                this.child.on("data", (data) => {
                    logging.log("dock(" + this.id + ").child.on(data): " + JSON.stringify(data.toString()));
                    
                    this.emit("data", data);
                });
                
                this.child.on("throw", (data) => {
                    logging.log("dock(" + this.id + ").child.on(throw): " + JSON.stringify(data.toString()));
                });

                this.child.on("start", (status, info) => {
                    logging.log("dock(" + this.id + ").child.on(start): status: " + status + (info ? ": " + info : ""));
                    
                    this.emit("run", status);
                });

                this.child.on("closing", (status) => {
                    this.child = null;
                    
                    logging.log("dock(" + this.id + ").child.on(closing): status: " + status);

                    // 124 is returned by timeout
                    
                    this.emit("finish", (status == 0 ? 0 : status == 124 ? -1 : 1));
                });
            } catch (info) {
                this.emit("run", 1);
                
                logging.log("dock(" + this.id + ").run: catch: " + info);
            }
        }
        
        input(input) {
            if (this.child == null) {
                logging.log("dock.input: not running");
                
                return -1;
            }
            
            logging.log("dock(" + this.id + ").input:", input);
            
            this.child.stdin(input);
            
            return 0;
        }
        
        finish_input() {
            if (this.child == null) {
                logging.log("dock.finish_input: not running");
                
                return -1;
            }
            
            logging.log("dock(" + this.id + ").finish_input");
            
            this.child.finish_stdin();
            
            return 0;
        }
        
        stop() {
            if (this.child == null) {
                logging.log("dock.stop: not running");
                
                this.emit("stop", -1);
                
                return;
            }
            
            try {
                var child = new Child(["docker", "kill", "rto_" + this.id]);
                
                logging.log("dock(" + this.id + ").stop: stopping");
                
                this.child.on("start", (status, info) => {
                    logging.log("dock(" + this.id + ").stop: status: " + status + (info ? ": " + info : ""));
                    
                    this.emit("stop", status);
                });
            } catch (info) {
                this.emit("stop", 1);
                
                logging.log("dock(" + this.id + ").stop: catch: " + info);
            }
        }
        
        get in_use() {
            return this.child == null ? 0 : 1;
        }
    }
    
    module.exports = {
        init: (Child_, options_, logging_) => {
            Child = Child_;
            
            options = options_;
            logging = logging_;
            
            return Dock;
        }
    };
})();
