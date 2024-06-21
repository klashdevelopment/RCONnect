import { Rcon } from 'rcon-client';
import express from 'express';
import { configToObject } from './rconfig.js';
import fs from 'fs';
import cors from 'cors';

const app = express();
app.use(cors());
const config_file = await fs.readFileSync("configuration/login.rconfig", "utf-8");
const config = await configToObject(config_file);
const client = new Rcon({
    host: config.ip,
    password: config.password,
    port: config.port
});
client.on('connect', () => {
    console.log("[rconnect-server] Connected with RCON server.");
});
client.on('authenticated', () => {
    console.log("[rconnect-server] Authenticated with RCON server.");
});
client.on('error', () => {
    console.log("[rconnect-server] Error connecting to RCON server.");
});
await client.connect();

let idresponse = {};

client.on('response', (requestId, packet) => {
    idresponse[requestId] = packet;
});
app.get('/', (req, res) => {
    res.json({ server: true, connected: client.connected });
});
app.get('/sendCommand', async (req, res) => {
    let command = req.query.command;
    let response = await client.send(command);
    res.send({ command: command, output: response });
});

// POST /post-inventory will give us a string[]. We need to store this, give it an ID, and return the ID.
let inventories = [];
let id = 0;
app.get('/post-inventory', (req, res) => {
    let inventory = JSON.parse(req.query.inv);
    inventories.push(inventory);
    res.status(200).send(""+id+"");
    id++;
});
// GET /get-inventory?id=0 will return the inventory with ID 0.
app.get('/get-inventory', (req, res) => {
    let id = req.query.id;
    res.status(200).send(inventories[id]);
});

app.listen(6304, () => {
    console.log("[rconnect-server] Server started on port 6304.");
});