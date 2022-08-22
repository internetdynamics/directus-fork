// https://docs.directus.io/reference/sdk/#items
const { Directus } = require('@directus/sdk');

let directus;
let config = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL
};

let directusClient = {

    init (_config) {
        for (let key in _config) {
            config[key] = _config[key];
        }
        directus = new Directus(config.apiBaseUrl);
    },

    async getObjects(tableName, params, columns, options = {}) {
        // console.log("ClientDatabase.getObjects(%s)", tableName, params, columns, options);
        let apiBaseUrl = config.apiBaseUrl;
        let url = apiBaseUrl + "/items/" + tableName;
        let query = [];
        if (columns) {
            if (typeof(columns) === "string") query.push("fields=" + columns);
            else if (Array.isArray(columns)) query.push("fields=" + columns.join(","));
        }

        if (params) {
            let type = typeof(params);
            if (type === "string" || type === "number") query.push(`filter[id][_eq]=${params}`);
            else if (type === "object") {
                let matches, col, op;
                for (let param in params) {
                    if (matches = param.match(/^(.*)\.(eq|ne|lt|le|gt|ge)$/)) {
                        col = matches[1];
                        op = matches[2];
                    }
                    else {
                        col = param;
                        op = "eq";
                    }
                    // console.log("XXX params: col [%s]", col)
                    if (col.indexOf(".") === -1) {
                        query.push(`filter[${col}][_${op}]=${params[param]}`);
                    }
                    else {
                        let parts = col.split(/\./);
                        if (parts.length === 2) {
                            query.push(`deep[${parts[0]}][_filter][${parts[1]}][_${op}]=${params[param]}`);
                        }
                        else {
                            console.log("ERROR: 3rd Layer Deep Params not yet supported [%s]", col);
                        }
                    }
                }
            }
        }

        if (options.orderBy) {
            let orderBy = options.orderBy;
            let matches, c, dir;
            let orderCols = [];
            if (typeof(orderBy) === "string") {
                orderBy = orderBy.split(/,/);
            }
            if (Array.isArray(orderBy)) {
                for (let col of orderBy) {
                    if (col.match(/^(.+)\.(asc|desc)$/i)) {
                        c = matches[1];
                        dir = matches[2].toLowerCase();
                        if (dir === "desc") orderCols.push("-" + c);
                        else orderCols.push(c);
                    }
                    else {
                        orderCols.push(col);
                    }
                }
                if (orderCols.length > 0) {
                    query.push(`sort=${orderCols.join(",")}`);
                }
            }
            if (options.limit) {
                query.push(`limit=${options.limit}`);
            }
            if (options.offset) {
                query.push(`offset=${options.offset}`);
            }
            if (options.page) {
                query.push(`page=${options.page}`);
            }
        }

        if (query.length > 0) {
            url += "?" + query.join("&");
        }
        // console.log("XXX url [%s]", url);

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // console.log("XXX res.url", res.url);
        // console.log("XXX res.status", res.status);
        // console.log("XXX res.statusText", res.statusText);

        // let resHeaders = res.headers;
        // console.log("XXX resHeaders.get('content-security-policy')", resHeaders.get('content-security-policy'));
        // console.log("XXX resHeaders.get('x-powered-by')", resHeaders.get('x-powered-by'));
        // console.log("XXX resHeaders.get('content-type')", resHeaders.get('content-type'));
        // console.log("XXX resHeaders.get('content-length')", resHeaders.get('content-length'));
        // console.log("XXX resHeaders.get('etag')", resHeaders.get('etag'));
        // console.log("XXX resHeaders.get('date')", resHeaders.get('date'));

        let jsonResponse = await res.json()
        if (jsonResponse.errors && jsonResponse.errors.length > 0) {
            console.error("ERRORS:", jsonResponse.errors);
            let err = jsonResponse.errors[0];
            let errstr = err.message;
            if (err.extensions && err.extensions.code) {
                errstr += ` (${err.extensions.code})`;
            }
            errstr += ` (GET) (${url})`;
            throw new Error(errstr);
        }

        let objects;
        if (!jsonResponse.data || typeof (jsonResponse.data) !== "object" || jsonResponse.data.constructor.name === "Blob") {
            objects = [];
        }
        else {
            objects = jsonResponse.data || [];
        }
        return (objects);
    },

    async getObject(tableName, params, columns, options = {}) {
        options = { ...options }; // make a shallow copy
        options.limit = 1;
        let objects = await this.getObjects(tableName, params, columns, options);
        let object = (objects && objects.length > 0) ? objects[0] : null;
        return(object);
    },
};

module.exports = directusClient;
