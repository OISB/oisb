(async () => {
    var dock_library = require("./dock");
    var child_library = require("./child");
    var docking_library = require("./docking");
    // var log_library = require("./log_2");
    
    var fs = require("fs").promises;
    
    var options = {};
    
    // var json_parsing = require("./json_parsing").init(options);
    
    var logging = {}; // log_library.init(options);
    
    var Child = child_library.init(options, logging);
    var Dock = dock_library.init(Child, options, logging);
    
    var docking = docking_library.init(Dock, options, logging);
    
    var dock = docking.provision();
    
    dock.run("hello-world");
    
    dock.on("run", (status) => console.log(status));
    dock.on("data", (data) => console.log(data.toString));
    dock.on("finish", (status) => console.log(status));
})();