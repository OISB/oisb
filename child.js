(() => {
    var child_process = require("child_process");
    
    var Readable = new require("stream").Readable;
    
    var options;
    var logging;
    
    class Child extends require("events").EventEmitter {
        constructor(run) {
            super();
            
            var child = child_process.spawn(run[0], run.slice(1));
            
            this.child = child;
            this.stdins = 0;
            this.finish = 0;
            
            child.on("spawn", () => {
                this.emit("start", 0);
            });
            
            child.on("error", (info) => {
                this.emit("start", 1, info);
            });
            
            child.on("close", (code) => {
                this.emit("closing", code);
            });

            var stdio = 0;
            
            child.stdout.on("data", (data) => {
                if (stdio + data.length > 1000) {
                    this.emit("data", data.slice(0, 1000 - stdio).toString() + "...");

                    child.kill("SIGKILL");
                    child.stdout.removeAllListeners("data");
                    child.stderr.removeAllListeners("data");

                    return;
                }

                stdio += data.length;
                
                this.emit("data", data.toString());
            });
            
            child.stderr.on("data", (data) => {
                if (stdio + data.length > 1000) {
                    this.emit("throw", data.slice(0, 1000 - stdio).toString() + "...");

                    child.kill("SIGKILL");
                    child.stdout.removeAllListeners("data");
                    child.stderr.removeAllListeners("data");

                    return;
                }

                stdio += data.length;

                this.emit("throw", data.toString());
            });
        }
        
        stdin(stdin) {
            var stdin_s = Readable({
                read: () => {}
            });
            
            stdin_s.push(stdin);
            stdin_s.push(null);

            stdin_s.pipe(this.child.stdin);
            
            this.stdins++;
            
            stdin_s.on("end", () => {
                if (this.finish && --this.stdins == 0)
                    this.child.stdin.end();
            });
        }
        
        finish_stdin() {
            this.finish = 1;
            
            if (this.stdins == 0)
                this.child.stdin.end();
        }
    }
    
    module.exports = {
        init: (options_, logging_) => {
            options = options_;
            logging = logging_;
            
            return Child;
        }
    };
})();
