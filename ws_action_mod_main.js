(async () => {
    var ws_library = require("./ws");
    var conn_library = require("./conn");
    var actor_library = require("./actor");
    var cast_library = require("./cast");
    var log_library = require("./log_2");
    
    var fs = require("fs").promises;
    
    var options = {
        port: 8081
    };
    
    var logging = log_library.init(options);
    
    var Conn = conn_library.init(options, logging);
    var Actor = actor_library.init(options, logging);
    
    var ws = await ws_library.init(Conn, options, logging);
    var cast = cast_library.init(options, logging);
    
    setInterval(() => cast.ping(), options.max_ping == null ? 40000 : options.max_ping);
    
    ws.on("conn", (conn) => {
        conn.on("data", (data) => {
            if (data.action != "initial")
                return;

            if (!("data" in data) || data.data == null || !("id" in data.data)) {
                conn.close(1002, "Invalid initial action");

                return;
            }

            var actor;
            
            if (data.data.id == null) {
                actor = new Actor(cast);

                actor.attach(conn);

                conn.notify({
                    action: "initial",
                    data: {
                        actor: actor.id
                    }
                });

                return;
            }

            actor = cast.find(data.data.id);

            if (!actor) {
                conn.close(1008);

                return;
            }

            actor.attach(conn);
        });
    });
    
    cast.on("actor", (actor) => {
        actor.on("run", (data) => console.log("run", data));
        actor.on("stop", (data) => console.log("stop", data));
    });
})();