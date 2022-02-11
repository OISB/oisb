(async () => {
    var ws_library = require("./ws");
    var conn_library = require("./conn");
    var actor_library = require("./actor");
    var cast_library = require("./cast");
    var dock_library = require("./dock");
    var child_library = require("./child");
    var docking_library = require("./docking");
    var format_library = require("./format");
    var log_library = require("./log_2");
    
    var fs = require("fs").promises;
    
    var options;
    
    try {
        options = JSON.parse(await fs.readFile("../options.json", "utf-8"));
    } catch (info) {
        options = {};
    }
    
    var configs;
    
    try {
        configs = new Map(Object.entries(JSON.parse(await fs.readFile("../configs.json", "utf-8"))));
    } catch (info) {
        configs = new Map();
    }
    
    var logging = log_library.init(options);
    
    var Conn = conn_library.init(options, logging);
    var Actor = actor_library.init(options, logging);
    
    var ws = await ws_library.init(Conn, options, logging);
    var cast = cast_library.init(options, logging);
    
    var Child = child_library.init(options, logging);
    var Dock = dock_library.init(Child, options, logging);
    
    var docking = docking_library.init(Dock, options, logging);
    
    var format = format_library.init(options, configs, logging);
    
    setInterval(() => cast.ping(), options.max_ping == null ? 40000 : options.max_ping);
    
    ws.on("conn", (conn) => {
        conn.on("data", (data) => {
            if (data.action != "initial")
                return;

            if (!("data" in data) || data.data == null || !("id" in data.data)) {
                conn.disconn(1002, "Invalid initial action");

                return;
            }
            
            logging.log("ws.on(conn).on(data): initial: " + JSON.stringify(data.data.id));

            var actor;

            if (data.data.id == null) {
                actor = new Actor(cast);

                actor.attach(conn);

                conn.notify({
                    action: "initial",
                    data: {
                        id: actor.id
                    }
                });

                return;
            }

            actor = cast.find(data.data.id);

            if (!actor) {
                conn.disconn(1008);

                return;
            }

            actor.attach(conn);
        });
    });
    
    cast.on("add", (actor) => {
        logging.log("cast.on(add): " + actor.id);
            
        var dock = docking.provision();

        dock.on("data", (data) => {
            logging.log("actor(" + actor.id + "): dock.on(data): " + JSON.stringify(data));

            data = format.bin_to_output(data);

            if (data == null) {
                logging.log("actor(" + actor.id + "): dock.on(data): invalid outputJSON");

                return;
            }

            actor.notify({
                action: "output",
                data: data
            });
        });
        
        actor.on("run", async (input, status_back) => {
            logging.log("actor(" + actor.id + ").on(run): " + JSON.stringify(input));

            var bin = format.input_to_bin(input);
                
            if (bin == null) {
                logging.log("actor(" + actor.id + ").on(run): invalid inputJSON");
                
                return;
            }
            
            if (!configs.has(String(input.lang))) {
                logging.log("actor(" + actor.id + ").on(run): unknown lang id: " + String(input.lang));

                actor.notify({
                    action: "throw",
                    data: {
                        id: "no_config",
                        long: "No config for ID: " + String(input.lang)
                    }
                });
                
                return;
            }
            
            dock.run(configs.get(input.lang).dock);

            console.log(bin);
            
            dock.input(bin);
            dock.finish_input();

            dock.once("finish", (status) => {
                logging.log("actor(" + actor.id + "): dock.on(finish): " + status);

                actor.notify({
                    action: "finish",
                    data: {
                        status: status
                    }
                });
            });
        });
        
        actor.on("stop", async (status_back) => {
            logging.log("actor(" + actor.id + ").on(stop)");
            
            dock.stop();
            
            dock.once("stop", (status) => {
                actor.notify({
                    action: "stop",
                    data: {
                        status: status
                    }
                });
            });
        });
    });
})();
