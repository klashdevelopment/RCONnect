/* RCONfig is a tool for the .rconfig file format */
/* An example .rconfig file:
[ip; 127.0.0.1]
[port; 25575]
[password; password123]
*/
/* This should parse into an object like this:
{
    ip: "127.0.0.1",
    port: 25575,
    password: "password123"
}
*/

export default class RCONfig {
    constructor() {
        this.config = {};
    }
    async parseConfig(config) {
        let lines = config.split("\n");
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.startsWith("#")) {
                continue;
            }
            let split = line.split(";");
            let key = split[0].replace("[", "").replace("]", "").trim();
            let value = split[1].trim().substring(0, split[1].trim().length - 1);
            this.config[key] = value;
        }
        return this.config;
    }
}
export async function configToObject(config) {
    let rconfig = new RCONfig();
    await rconfig.parseConfig(config);
    return rconfig.config;
}