'use client';
import { Input, Button, CssVarsProvider, Sheet, Select, Option, Modal, ModalClose, ModalDialog, Typography } from "@mui/joy";
import Image from "next/image";
import { useState } from "react";
import McText from './mctext/McText.jsx';
import { Cached, Chat, Inventory, Explore } from '@mui/icons-material';
import JSON5 from 'json5';
import items from "./items.jsx";

const colors = [
  ["#000000", "black"],
  ["#0000AA", "dark_blue"],
  ["#00AA00", "dark_green"],
  ["#00AAAA", "dark_aqua"],
  ["#AA0000", "dark_red"],
  ["#AA00AA", "dark_purple"],
  ["#FFAA00", "gold"],
  ["#AAAAAA", "gray"],
  ["#555555", "dark_gray"],
  ["#5555FF", "blue"],
  ["#55FF55", "green"],
  ["#55FFFF", "aqua"],
  ["#FF5555", "red"],
  ["#FF55FF", "light_purple"],
  ["#FFFF55", "yellow"],
  ["#FFFFFF", "white"]
];

export default function Home() {
  const [MSG1, setMSG1] = useState("[unset]");
  const [IP, setIP] = useState("127.0.0.1");
  const [CONNECTED, setCONNECTED] = useState(false);

  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");

  const [selPlayer, setSelPlayer] = useState("");
  const [selPlayerCoords, setSelPlayerCoords] = useState([0, 0, 0]);
  const [players, setPlayers] = useState<string[]>([]);

  const [tellrawMessage, setTellrawMessage] = useState("");
  const [tellrawColor, setTellrawColor] = useState("white");
  const [tellrawBold, setTellrawBold] = useState(false);
  const [tellrawItalic, setTellrawItalic] = useState(false);
  const [tellrawUnderline, setTellrawUnderline] = useState(false);
  const [tellrawStrikethrough, setTellrawStrikethrough] = useState(false);
  const [tellrawObfuscated, setTellrawObfuscated] = useState(false);
  const [tellrawOpen, setTellrawOpen] = useState(false);

  const [coordsOpen, setCoordsOpen] = useState(false);
  const [coords, setCoords] = useState([0, 0, 0]);

  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [messageInvError, setMessageInvError] = useState("");
  const [giveItem, setGiveItem] = useState("");
  const [inventory, setInventory] = useState<string[]>(
    ["dirt","stone","stone","cobblestone","cobblestone","sand","cobblestone","andesite","granite","diorite","gravel","cobblestone","cobblestone","","","","","","","","","","","","","","","iron_sword","iron_pickaxe","iron_axe","","","","","golden_carrot","water_bucket"]
  );

  function checkConnection(ip: string) {
    setMSG1("[loading action check_connection]");
    fetch(`http://${ip}:6304/`)
      .then((response) => response.json())
      .then((data) => {
        setMSG1(`Connected (RCONnect API): ${data.server} - Connected (Minecraft): ${data.connected}`);
        setCONNECTED(true);
      }).catch((error) => {
        setMSG1(`Unable to connect to server!`);
      });
  }
  function itemIcon(item: string) {
    if(item == null || item == undefined || item.trim() == "") {
      return "https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png";
    }
    return `https://mcapi.marveldc.me/item/${item.replaceAll('minecraft:', '')}?version=1.21&width=128&height=128&fuzzySearch=false`;
  }
  function sendCommand() {
    setCommand("");
    setMSG1("[loading action send_command]");
    fetch(`http://${IP}:6304/sendCommand?command=${command}`)
      .then((response) => response.json())
      .then((data) => {
        setMSG1(`send_command= ${data.command}`);
        setOutput(data.output.replaceAll("Â§", "§"));
      }).catch((error) => {
        setMSG1(`Unable to send command to server!`);
      });
  }
  function getCommandResult(command: string, callback: Function) {
    fetch(`http://${IP}:6304/sendCommand?command=${command}`)
      .then((response) => response.json())
      .then((data) => {
        callback(data.output.replaceAll("Â§", "§"));
      }).catch((error) => {
        console.error("gcr- " + error);
      });
  }
  function tellraw(player: string, message: string) {
    let finalMessage = `{"text":"${message}", "color":"${tellrawColor}", "bold":${tellrawBold}, "italic":${tellrawItalic}, "underlined":${tellrawUnderline}, "strikethrough":${tellrawStrikethrough}, "obfuscated":${tellrawObfuscated}}`;
    fetch(`http://${IP}:6304/sendCommand?command=minecraft:tellraw ${player} ${finalMessage}`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setTellrawMessage("");
      }).catch((error) => {
        console.error("tr- " + error);
      });
  }
  function refreshInventory() {
    getCommandResult(`rconnect:rconnect-inventory-data ${selPlayer}`, (output: string) => {
      if(!output.startsWith("[RCONnect]")) {
        setMessageInvError("Unable to get inventory - do you have the RCONnect plugin installed?")
      }
    });
  }

  return (
    <CssVarsProvider defaultMode={'dark'}>
      <Modal open={tellrawOpen} onClose={() => { setTellrawOpen(false) }}>
        <ModalDialog>
          <ModalClose />
          <Typography
            component="h2"
            id="modal-title"
            level="h4"
            textColor="inherit"
            fontWeight="lg"
            mb={1}>Tellraw Messages</Typography>
          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Circle of each color */}
            {colors.map((color, index) => {
              return <div key={index} style={{ width: '20px', height: '20px', borderRadius: '50%', border: `${color[1] == tellrawColor ? '2px solid white' : 'none'}`, boxShadow: `${color[1] == tellrawColor ? '' : ''}`, backgroundColor: color[0] }} onClick={() => {
                setTellrawColor(color[1]);
              }}></div>;
            })}
          </div>
          {/* Another div for formatting such as 'B', 'I', 'U' */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
            <Button color="primary" variant={tellrawBold ? 'solid' : 'outlined'} onClick={() => {
              setTellrawBold(!tellrawBold);
            }}><b>B</b></Button>
            <Button color="primary" variant={tellrawItalic ? 'solid' : 'outlined'} onClick={() => {
              setTellrawItalic(!tellrawItalic);
            }}><i>I</i></Button>
            <Button color="primary" variant={tellrawUnderline ? 'solid' : 'outlined'} onClick={() => {
              setTellrawUnderline(!tellrawUnderline);
            }}><p style={{ textDecoration: 'underline' }}>U</p></Button>
            <Button color="primary" variant={tellrawStrikethrough ? 'solid' : 'outlined'} onClick={() => {
              setTellrawStrikethrough(!tellrawStrikethrough);
            }}><p style={{ textDecoration: 'line-through' }}>S</p></Button>
            <Button color="primary" variant={tellrawObfuscated ? 'solid' : 'outlined'} onClick={() => {
              setTellrawObfuscated(!tellrawObfuscated);
            }}>O</Button>
          </div>
          {selPlayer ? <Input value={tellrawMessage} placeholder={"Send to " + selPlayer} sx={{ width: '100%' }} onChange={(e) => { setTellrawMessage(e.target.value) }} endDecorator={<Button onClick={() => {
            tellraw(selPlayer, tellrawMessage);
          }}>Send</Button>} /> : <Typography>No player selected</Typography>}
        </ModalDialog>
      </Modal>

      <Modal open={coordsOpen} onClose={() => { setCoordsOpen(false) }}>
        <ModalDialog>
          <ModalClose />
          <Typography
            component="h2"
            id="modal-title"
            level="h4"
            textColor="inherit"
            fontWeight="lg"
            mb={1}>Player Coordinates</Typography>
            {selPlayer ? 
              <>
                {/* 3 inputs split for X Y Z */}
                <div style={{display:'flex',width:'300px'}}>
                  <Input placeholder="X" variant={'plain'} readOnly={true} value={selPlayerCoords[0]} type="number" />
                  <Input placeholder="Y" variant={'plain'} readOnly={true} value={selPlayerCoords[1]} type="number" />
                  <Input placeholder="Z" variant={'plain'} readOnly={true} value={selPlayerCoords[2]} type="number" />
                </div>
                <Button color="primary" onClick={() => {
                  getCommandResult(`minecraft:data get entity ${selPlayer} Pos`, (output: string) => {
                    const position = eval(`${output.replaceAll('d', '').split(": ")[1].split(", ")}`);
                    setSelPlayerCoords(position);
                  });
                }}><Cached style={{ marginRight: '10px' }} />Get Current Position</Button>
                <br/>
                <div style={{display:'flex',width:'300px'}}>
                <Input placeholder="X" onChange={(e)=>{
                  setCoords([parseInt(e.target.value), coords[1], coords[2]]);
                }} type="number" />
                <Input placeholder="Y" onChange={(e)=>{
                  setCoords([coords[0], parseInt(e.target.value), coords[2]]);
                }} type="number" />
                <Input placeholder="Z" onChange={(e)=>{
                  setCoords([coords[0], coords[1], parseInt(e.target.value)]);
                }} type="number" />
                </div>
                <Button color="primary" onClick={() => {
                  getCommandResult(`minecraft:tp ${selPlayer} ${coords[0]} ${coords[1]} ${coords[2]}`, (output: string) => {});
                }}><Cached style={{ marginRight: '10px' }} />Teleport Player</Button>
              </>
          : <Typography>No player selected</Typography>}
        </ModalDialog>
      </Modal>

      <Modal open={inventoryOpen} onClose={() => { setInventoryOpen(false) }}>
        <ModalDialog>
          <ModalClose />
          <Typography
            component="h2"
            id="modal-title"
            level="h4"
            textColor="inherit"
            fontWeight="lg"
            mb={1}>Player Inventory & Items</Typography>
            {selPlayer ? 
              <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(9, 1fr)',gap:'5px',filter:'blur(3px)'}}>
              {inventory.map((item, index) => {
                return <div key={index} style={{width:'30px',height:'30px',border:'1px solid black',backgroundColor:'#333'}}>
                  <img src={itemIcon(item == null ? 'barrier' : item)} style={{width:'100%',height:'100%'}}/>
                </div>;
              })}
            </div>
            <Typography>{messageInvError}</Typography>
            <Button color="primary" onClick={() => {
              refreshInventory();
            }}><Cached style={{ marginRight: '10px' }} />Refresh Inventory</Button>
            <Input placeholder="Item ID (ex. iron_block)" sx={{ width: '100%' }} onChange={(e)=>{setGiveItem(e.target.value)}} endDecorator={<Button onClick={() => {
              getCommandResult(`minecraft:give ${selPlayer} ${giveItem}`, (output: string) => {});
            }} color="primary">Give</Button>} startDecorator={<img src={itemIcon(giveItem)} style={{width:'24px',height:'24px'}}/>} />
            </>
            : <Typography>No player selected</Typography>}
        </ModalDialog>
      </Modal>

      <main>
        <div style={{ textAlign: 'center', margin: '10% 20%', width: '60%', display: `${CONNECTED ? 'none' : 'flex'}`, flexDirection: 'column', alignItems: 'center' }}>
          <h1>RCONnect</h1>
          <b>Status: {MSG1}</b>
          <Input placeholder="IP Address" sx={{ width: '180px' }} onChange={(event) => {
            setIP(event.target.value);
          }} />
          <Button color="primary" onClick={() => { checkConnection(IP) }}>Connect using IP</Button>
          <br />

          <Button color="primary" onClick={() => { checkConnection("localhost") }}>Connect to localhost</Button>
        </div>
        <div style={{ textAlign: 'center', margin: '10% 20%', width: '60%', display: `${CONNECTED ? 'flex' : 'none'}`, flexDirection: 'column', alignItems: 'center' }}>
          <h1>RCONnect Panel</h1>
          <b>Status: {MSG1}</b>
          <Button color="primary" onClick={() => { checkConnection(IP) }}>Reconnect</Button>
          <br />
          <Sheet variant="outlined" sx={{ width: '100%', padding: '20px', borderRadius: '10px' }}>
            <h2>Section - Commands</h2>
            <Input placeholder="Command" value={command} onChange={(e) => { setCommand(e.target.value); }} sx={{ width: '100%' }} endDecorator={<Button onClick={sendCommand} color="primary">Execute</Button>} />
            <Sheet variant="outlined" sx={{ overflowY: 'scroll', width: '100%', minHeight: '200px', marginTop: '20px', textAlign: 'left', padding: '10px' }}>
              {output.split("\n").map((line: string, index: number) => {
                return <>{index == 0 ? undefined : <br />}<McText key={index}>{line}</McText></>;
              })}
            </Sheet>
          </Sheet><br />
          <Sheet variant="outlined" sx={{ width: '100%', padding: '20px', borderRadius: '10px' }}>
            <h2>Section - Players</h2>
            <Select endDecorator={
              <Button color="primary" onClick={() => {
                getCommandResult("list", (output: string) => {
                  setPlayers(output.split(": ")[1].split(", "));
                });
              }}><Cached /></Button>
            } placeholder="Select Player..." indicator={null} sx={{ width: '100%' }} onChange={(e, val) => {
              setSelPlayer(val as string);
            }}>
              {players.map((player: string, index: number) => {
                return <Option key={index} value={player}>{player}</Option>;
              })}
            </Select>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <Button color="primary" onClick={() => {
                setCoordsOpen(true);
              }}><Explore style={{ marginRight: '10px' }} />Position</Button>
              <Button color="primary" onClick={() => {
                setTellrawOpen(true);
              }}><Chat style={{ marginRight: '10px' }} />Tellraw</Button>
              <Button color="primary" onClick={() => {
                setInventoryOpen(true);
              }}><Inventory style={{ marginRight: '10px' }} />Inventory</Button>
            </div>
          </Sheet>
        </div>
      </main>
    </CssVarsProvider>
  );
}
