(() => {
    var options;
    var configs;
    var logging;
    
    var from_array_string = (str) => {
        var array = [];

        var i = 0;

        var k, c_count, b_count, data;

        while (i < str.length) {
            if (!(i in str))
                return null;

            c_count = str[i++];
            b_count = 0;

            if (!(((i - 1) + c_count) in str))
                return null;

            for (k = 0; k < c_count; k++)
                b_count = b_count * 256 + str[i++];

            if (!(((i - 1) + b_count) in str))
                return null;

            data = Buffer.alloc(b_count);

            for (k = 0; k < b_count; k++)
                data[k] = str[i++];

            array.push(data);
        }

        return array;
    };
    
    var first_string = (str) => {
        if (!(0 in str))
            return null;

        var c_count = str[0];
        var b_count = 0;

        if (!(c_count in str))
            return null;

        var k;

        for (k = 0; k < c_count; k++)
            b_count = b_count * 256 + str[k + 1];

        if (!((c_count + b_count) in str))
            return null;

        var data = Buffer.alloc(b_count);

        for (k = 0; k < b_count; k++)
            data[k] = str[k + c_count + 1];

        return [data, str.slice(b_count + c_count + 1)];
    };
    
    var byte_count = (str) => {
        var count = [];
        var n = str.length;
        var nb = 0;
        
        while (n != 0) {
            count.push(n % 256);
            n = Math.floor(n / 256);
            
            nb++;
        }
        
        count.reverse();

        return Buffer.from([nb, ...count, ...str]);
    };
    
    var to_array_string = (array) => {
        var str = [];
        
        for (var s of array)
            str = str.concat([...byte_count(s)]);
       
       return Buffer.from(str);
    };
    
    var is_misc = (data) => typeof data == "string" || Array.isArray(data) && !data.some(d => !is_misc(d));
    var misc_to_array_string = (data) => typeof data == "string" ? Buffer.from(data) : to_array_string(data.map(d => misc_to_array_string(d)));
    
    module.exports = {
        init: (options_, configs_, logging_) => {
            options = options_;
            configs = configs_;
            logging = logging_;
            
            return {
                input_to_bin: (data) => {
                    if (!("lang" in data) || !("code" in data) || !("input" in data))
                        return null;
                    
                    if (typeof data.lang != "string")
                        return null;
                    if (typeof data.code != "string")
                        return null;
                    if (typeof data.input != "string")
                        return null;
                    if ("args" in data && (!Array.isArray(data.args) || data.args.some(d => typeof d != "string")))
                        return null;
                    if ("c_args" in data && (!Array.isArray(data.c_args) || data.c_args.some(d => typeof d != "string")))
                        return null;
                    if ("misc" in data && !is_misc(data.misc))
                        return null;
                    
                    return byte_count(misc_to_array_string([data.code, data.input, "args" in data ? data.args : [], "c_args" in data ? data.c_args : [], "misc" in data ? data.misc : ""]));
                },
                bin_to_output: (data) => {
                    data = from_array_string(data);
                    
                    if (data == null)
                        return null;
                    
                    data = data.map(d => first_string(d));
                    
                    if (data.includes(null))
                        return null;
                    
                    try {
                        return Object.fromEntries(data.map(d => [new TextDecoder().decode(d[0]), new TextDecoder().decode(d[1])]));
                    } catch (info) {
                        return null;
                    }
                }
            };
        }
    };
})();

