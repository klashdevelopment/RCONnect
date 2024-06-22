'use client';
import { Input, Button, Autocomplete, CssVarsProvider, Sheet, Select, Option, Modal, ModalClose, ModalDialog, Typography, Accordion, AccordionSummary, AccordionDetails, AccordionGroup } from "@mui/joy";
import Image from "next/image";
import { useState } from "react";
import McText from './mctext/McText.jsx';
import { Cached, Chat, Inventory, Explore, DeleteForever, Hiking, DownhillSkiing, Money, Visibility, ExitToApp, Block, Gradient, ColorLens, QuestionMark, NightsStay, Brightness6, DarkMode, WbSunny, WbTwilight, RemoveModerator, AddModerator, PersonAdd } from '@mui/icons-material';
import JSON5 from 'json5';
import { items, entities } from "./items";

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

  const [plugins, setPlugins] = useState<string[]>([]);

  const [entityName, setEntityName] = useState("");
  const [entityMessage, setEntityMessage] = useState("");
  const [entityitem, setEntityItem] = useState("air");
  const [entityAt, setEntityAt] = useState("");

  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");

  const [time, setTime] = useState("none");

  const [version, setVersion] = useState("Press the button to get the version.");

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
  const [giveItem, setGiveItem] = useState("air");
  const [giveAmount, setGiveAmount] = useState(1);
  const [inventory, setInventory] = useState<[string, number][]>(
    new Array(36).fill(["", 0])
  );

  const [pluginFound, setPluginFound] = useState(false);

  function splitToNChunks(array: Array<any>, n: number) {
    let result = [];
    for (let i = n; i > 0; i--) {
      result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
  }

  function secondsToHumanReadable(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${
      secs == 0 ? "" : secs + "s"
    }`;
  }

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
  function itemIcon(item: string|null) {
    if (item == null || item == undefined || item == "" || item == " ") {
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
        setMSG1(`${data.command}`);
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
    getCommandResult(`rconnect-inventory-data ${selPlayer}`, (output: string) => {
      if (!output.startsWith("[RCONnect]")) {
        setMessageInvError("You need the RCONnect-Features plugin - see docs");
        setPluginFound(false);
      } else {
        setPluginFound(true);
        const result = output.substring(`[RCONnect]`.length);
        if (result == "pnf") {
          setMessageInvError("Selected player not online or not found.");
          return;
        }
        const id = parseInt(result);
        fetch(`http://${IP}:6304/get-inventory?id=${id}`)
          .then((response) => response.json())
          .then((data) => {
            setInventory(data);
            setMessageInvError("Completed action & refreshed inventory.");
          }).catch((error) => {
            console.error("ri- " + error);
          });
      }
    });
  }
  function outputToPluginList(input: string) {
    const plugins = input.replaceAll('\n',', ').split("§8- ")[1].split(", ");
    const strippedPlugins = plugins.map(plugin => plugin.replace(/§[0-9a-f]/gi, '').replace('§r',''));
    strippedPlugins.splice(strippedPlugins.length-1,1);
    return strippedPlugins;
  }

  function dataGetEntity(entity: string, path: string, callback: Function) {
    getCommandResult(`minecraft:data get entity ${entity} ${path}`, (output: string) => {
      callback(output.substring(`
        ${selPlayer} has the following entity data: `.length));
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
              <div style={{ display: 'flex', width: '300px' }}>
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
              <br />
              <div style={{ display: 'flex', width: '300px' }}>
                <Input placeholder="X" onChange={(e) => {
                  setCoords([parseInt(e.target.value), coords[1], coords[2]]);
                }} type="number" />
                <Input placeholder="Y" onChange={(e) => {
                  setCoords([coords[0], parseInt(e.target.value), coords[2]]);
                }} type="number" />
                <Input placeholder="Z" onChange={(e) => {
                  setCoords([coords[0], coords[1], parseInt(e.target.value)]);
                }} type="number" />
              </div>
              <Button color="primary" onClick={() => {
                getCommandResult(`minecraft:tp ${selPlayer} ${coords[0]} ${coords[1]} ${coords[2]}`, (output: string) => { });
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
              <Typography>Click a slot to replace it with the selected item below</Typography>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '0px', width: 'fit-content', filter:`${pluginFound?'none':'blur(4px)'}` }}>
                {splitToNChunks([...inventory.toReversed()], 4).map((row, rowidx) => {
                  return row.toReversed().map((item: [string,number], idx: number) => {
                    return <div onClick={()=>{
                      const slot = (3-rowidx) * 9 + idx;
                      setMessageInvError("Setting item "+slot+" to "+giveItem+" x"+giveAmount);
                      getCommandResult(`minecraft:item replace entity ${selPlayer} container.${slot} with ${giveItem} ${giveAmount}`, (output: string) => {
                        refreshInventory();
                      });
                    }} key={idx} style={{ width: '30px', height: '30px', border: '2px solid #444', backgroundColor: '#222', position: 'relative' }}>
                      <img src={itemIcon(item[0] == "air" ? null : item[0])} style={{ width: '100%', height: '100%' }} />
                      {item[0] != "air" ? <p style={{fontFamily:'Mojangles',fontSize:'12px',position:'absolute',bottom:'-3px',right:'0px'}}>{item[1]}</p> : undefined}
                    </div>;
                  });
                })}
              </div>
              <Typography>{messageInvError}</Typography>
              
              <div style={{ display: 'flex', gap:'3px' }}>
                <Button color="primary" onClick={() => {
                  refreshInventory();
                }}><Cached style={{ marginRight: '5px' }} />Refresh</Button>
                <Button color="primary" onClick={() => {
                  getCommandResult(`minecraft:clear ${selPlayer}`, (output: string) => {
                    refreshInventory();
                  });
                }}><DeleteForever style={{ marginRight: '5px' }} />Clear</Button>
              </div>
              
              <div style={{ display: 'flex' }}>
                <Autocomplete options={items} freeSolo disableClearable placeholder="Item ID (ex. iron_block)" sx={{ width: '100%' }} onChange={(e, v) => { setGiveItem(v as string) }} startDecorator={<img src={itemIcon(giveItem)} style={{ width: '24px', height: '24px' }} />} />
                <Input defaultValue={1} onChange={(e)=>{setGiveAmount(parseInt(e.target.value))}} type="number" sx={{ width: '160px', marginLeft: '5px' }} endDecorator={
                  <Button onClick={() => {
                    getCommandResult(`minecraft:give ${selPlayer} ${giveItem} ${giveAmount}`, (output: string) => { });
                  }} color="primary" disabled={!items.includes(giveItem)}>Give</Button>
                } />
              </div>
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
        <div className="rcon-panel" style={{ textAlign: 'center', margin: '10% 20%', width: '60%', display: `${CONNECTED ? 'flex' : 'none'}`, flexDirection: 'column', alignItems: 'center' }}>
          <h1>RCONnect Panel</h1>
          <b>Status: {MSG1}</b>
          <Button color="primary" onClick={() => { checkConnection(IP) }}>Reconnect</Button>
          <br />
          <Sheet variant="outlined" sx={{ width: '100%', padding: '20px', borderRadius: '10px' }}>
            <h2>Section - Commands</h2>
            <Input placeholder="Command" value={command} onChange={(e) => { setCommand(e.target.value); }} sx={{ width: '100%' }} endDecorator={<Button onClick={sendCommand} color="primary">Execute</Button>} />
            <Sheet variant="outlined" sx={{ overflowY: 'scroll', width: '100%', minHeight: '200px', maxHeight:'350px', marginTop: '20px', textAlign: 'left', padding: '10px' }}>
              {output.split("\n").map((line: string, index: number) => {
                return <>{index == 0 ? undefined : <br />}<McText key={index}>{line}</McText></>;
              })}
            </Sheet>
          </Sheet><br />
          <Sheet variant="outlined" sx={{ width: '100%', padding: '20px', borderRadius: '10px' }}>
            <h2>Section - Players</h2>
            <Select endDecorator={
              <Button color="primary" onClick={() => {
                getCommandResult("minecraft:list", (output: string) => {
                  setPlayers(["@a", "@e", ...output.split(": ")[1].split(", ")]);
                });
              }}><Cached /></Button>
            } placeholder="Select Player..." indicator={null} sx={{ width: '100%' }} onChange={(e, val) => {
              setSelPlayer(val as string);
            }}>
              {players.map((player: string, index: number) => {
                return <Option key={index} value={player}>{player}</Option>;
              })}
            </Select>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px',justifyContent:'center' }} className="button-pane">
              <Button disabled={!selPlayer} color="success" onClick={() => {
                setCoordsOpen(true);
              }}><Explore style={{ marginRight: '10px' }} />Position</Button>
              <Button disabled={!selPlayer} color="success" onClick={() => {
                setTellrawOpen(true);
              }}><Chat style={{ marginRight: '10px' }} />Tellraw</Button>
              <Button disabled={!selPlayer} color="success" onClick={() => {
                setInventoryOpen(true);
              }}><Inventory style={{ marginRight: '10px' }} />Inventory</Button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px',justifyContent:'center' }} className="button-pane">
              {/* Buttons for Survival, Creative, Spectator, Adventure */}
              <Button disabled={!selPlayer} color="primary" onClick={() => {
                getCommandResult(`minecraft:gamemode survival ${selPlayer}`, (output: string) => { });
              }}><Hiking style={{marginRight:'10px'}}/>Survival</Button>
              <Button disabled={!selPlayer} color="primary" onClick={() => {
                getCommandResult(`minecraft:gamemode creative ${selPlayer}`, (output: string) => { });
              }}><ColorLens style={{marginRight:'10px'}}/>Creative</Button>
              <Button disabled={!selPlayer} color="primary" onClick={() => {
                getCommandResult(`minecraft:gamemode spectator ${selPlayer}`, (output: string) => { });
              }}><Visibility style={{marginRight:'10px'}}/>Spectator</Button>
              <Button disabled={!selPlayer} color="primary" onClick={() => {
                getCommandResult(`minecraft:gamemode adventure ${selPlayer}`, (output: string) => { });
              }}><DownhillSkiing style={{marginRight:'10px'}}/>Adventure</Button>
            </div>
            {/* Another div with buttons for Kick, Ban, Kill, Op, Deop */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px',justifyContent:'center' }} className="button-pane">
              <Button disabled={!selPlayer} color="danger" onClick={() => {
                getCommandResult(`minecraft:kick ${selPlayer} Kicked by an admin from RCONnect`, (output: string) => { });
              }}><ExitToApp style={{marginRight:'10px'}}/>Kick</Button>
              <Button disabled={!selPlayer} color="danger" onClick={() => {
                getCommandResult(`minecraft:ban ${selPlayer}`, (output: string) => { });
              }}><Block style={{marginRight:'10px'}}/>Ban</Button>
              <Button disabled={!selPlayer} color="danger" onClick={() => {
                getCommandResult(`minecraft:kill ${selPlayer}`, (output: string) => { });
              }}><Gradient style={{marginRight:'10px'}}/>Kill</Button>
              <Button disabled={!selPlayer} color="danger" onClick={() => {
                getCommandResult(`minecraft:op ${selPlayer}`, (output: string) => { });
              }}><AddModerator style={{marginRight:'10px'}}/>OP</Button>
              <Button disabled={!selPlayer} color="danger" onClick={() => {
                getCommandResult(`minecraft:deop ${selPlayer}`, (output: string) => { });
              }}><RemoveModerator style={{marginRight:'10px'}}/>DEOP</Button>
            </div>
          </Sheet><br />
          <Sheet variant="outlined" sx={{ width: '100%', padding: '20px', borderRadius: '10px' }}>
            <h2>Section - Server</h2>
            <AccordionGroup transition="0.2s ease">
              <Accordion>
                <AccordionSummary sx={{textAlign:'center'}}>Plugins</AccordionSummary>
                <AccordionDetails>
                <Button color="primary" onClick={() => {
                  getCommandResult("bukkit:plugins", (output: string) => {
                    if(!output.startsWith("§fServer Plugins")) {
                      setMSG1("Unable to get plugins list.");
                      return;
                    }
                    setPlugins(outputToPluginList(output));
                  });
                }}><Cached style={{ marginRight: '10px' }} />Refresh</Button>
                  <div className="plugin-map" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                    {plugins.map((plugin: string, index: number) => {
                      return <div key={index} style={{ display:'flex',justifyContent:'center',alignItems:'center', padding: '10px 15px', backgroundColor: '#ffffff20', borderRadius: '10px', fontFamily: 'Mojangles', color:"#55FF55" }}>{plugin}
                      <span style={{marginLeft:'8px', height:'30px',width:'30px',border:'1px solid #ffffff10',display:'flex',justifyContent:'center',alignItems:'center',borderRadius:'5px',background:'#444',zIndex:'2',cursor:'pointer'}} className="hover555">
                        <Cached htmlColor="#FFAA00"/>
                      </span>
                      <span style={{marginLeft:'8px', height:'30px',width:'30px',border:'1px solid #ffffff10',display:'flex',justifyContent:'center',alignItems:'center',borderRadius:'5px',background:'#444',zIndex:'2',cursor:'pointer'}} className="hover555">
                        <DeleteForever htmlColor="#FF5555"/>
                      </span>
                      </div>;
                    })}
                  </div>
                </AccordionDetails>
              </Accordion>
              <Accordion defaultExpanded={true}>
                <AccordionSummary>Control</AccordionSummary>
                <AccordionDetails>
                  {/* buttons for /minecraft:stop, /spigot:restart, /bukkit:version */}
                  <Typography>Server Version: {version}</Typography>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px',justifyContent:'center' }} className="button-pane">
                    <Button color="danger" onClick={() => {
                      getCommandResult("minecraft:stop", (output: string) => { });
                    }}><ExitToApp style={{ marginRight: '10px' }} />Stop</Button>
                    <Button color="danger" onClick={() => {
                      getCommandResult("spigot:restart", (output: string) => { });
                    }}><Cached style={{ marginRight: '10px' }} />Restart</Button>
                    <Button color="neutral" onClick={() => {
                      getCommandResult("bukkit:version", (output: string) => {
                        if(output.includes('§f§oChecking version')) {
                          setVersion("First time checking, please press one more time.");
                          return;
                        }
                        const build = output.split(" version ")[0].replace('This server is running', '').replace('§f ','');
                        setVersion(`${build} 1${output.split(" version 1")[1]}`.split("@")[0]);
                        if(output.includes('behind')) {
                          const behind = output.split("You are ")[1].split(" version(s)")[0];
                          setVersion(`${build} 1${output.split(" version 1")[1]}`.split("@")[0] + ` (Behind by ${behind} builds)`);
                        }
                      });
                    }}><QuestionMark style={{ marginRight: '10px' }} />Version</Button>
                  </div>
                </AccordionDetails>
              </Accordion>
            </AccordionGroup><br/>
          </Sheet>
          <br />
          <Sheet variant="outlined" sx={{ width: '100%', padding: '20px', borderRadius: '10px' }}>
            <h2>Section - World</h2>
            <p>World Playtime: {time}</p>
            <Button color="primary" onClick={() => {
              getCommandResult("minecraft:time query gametime", (output: string) => {
                const time = output.split("time is ")[1];
                // setTime(time);
                setTime(secondsToHumanReadable(parseInt(time)/20));
              });
            }}><Cached style={{ marginRight: '10px' }} />Playtime</Button>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px',justifyContent:'center' }} className="button-pane">
              <Button color="neutral" onClick={() => {
                getCommandResult("minecraft:time set day", (output: string) => { });
              }}><WbSunny style={{ marginRight: '10px' }} />Day</Button>
              <Button color="neutral" onClick={() => {
                getCommandResult("minecraft:time set night", (output: string) => { });
              }}><WbTwilight style={{ marginRight: '10px' }} />Night</Button>
              <Button color="neutral" onClick={() => {
                getCommandResult("minecraft:time set noon", (output: string) => { });
              }}><Brightness6 style={{ marginRight: '10px' }} />Noon</Button>
              <Button color="neutral" onClick={() => {
                getCommandResult("minecraft:time set midnight", (output: string) => { });
              }}><NightsStay style={{ marginRight: '10px' }} />Midnight</Button>
            </div>
            <br/>
            <b>Entities{entityName==""?undefined:` | Selected ${entityName}`}</b>
            <p>{entityMessage}</p>{entityMessage ? <br/> : undefined}
            <i>Choose "item" for dropped items</i>
            <Autocomplete disableClearable freeSolo startDecorator={entities.includes(entityName) ? <img src={`https://raw.githubusercontent.com/klashdevelopment/RCONnect/assets/entity-icons/${entityName}.png`} style={{ width: '32px', height: '32px', rotate: `${entityName=='item'?'0deg':'180deg'}`, scale:`${entityName=='item'?'2':'2.5'}`}} /> : undefined}
             placeholder="Select Entity to Spawn" sx={{ width: '100%' }} onChange={(e, val) => {setEntityName(val as string);}} options={entities}></Autocomplete>
            {entityName == "item" ? <Autocomplete options={items} freeSolo disableClearable placeholder="Select Item to Drop" sx={{ width: '100%',marginTop:'5px' }} onChange={(e, v) => { setEntityItem(v as string) }} startDecorator={<img src={itemIcon(entityitem)} style={{ width: '24px', height: '24px' }} />} /> : undefined}
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px',justifyContent:'center' }} className="button-pane">
              <Button disabled={!entities.includes(entityName)||!selPlayer} color="success" onClick={() => {
                getCommandResult(`minecraft:execute at ${selPlayer} run summon minecraft:${entityName} ~ ~ ~${entityName=="item"?' {Item:{id:"minecraft:'+entityitem+'",Count:1}}':''}`, (output: string) => {
                  setEntityMessage(output);
                  if(output.startsWith('Summoned new')) {
                    setEntityMessage(`Spawned ${entityName}${entityName=='item'?` (${entityitem})`:''} at ${selPlayer}'s location`);
                  }
                });
              }}><PersonAdd style={{ marginRight: '10px' }} />Spawn at Selected Player</Button>
              <Button disabled={!entities.includes(entityName)} color="danger" onClick={() => {
              getCommandResult(`minecraft:kill @e[type=minecraft:${entityName}]`, (output: string) => {
                setEntityMessage(output);
              });
            }}><DeleteForever style={{ marginRight: '10px' }} />Kill All of Type</Button>
            </div>
            {/* Another select entity for entityat */}
            <Autocomplete options={entities} freeSolo disableClearable placeholder="Select Entity to Target" sx={{ width: '100%',marginTop:'5px' }} onChange={(e, v) => { setEntityAt(v as string) }} startDecorator={entities.includes(entityAt) ? <img src={`https://raw.githubusercontent.com/klashdevelopment/RCONnect/assets/entity-icons/${entityAt}.png`} style={{ width: '32px', height: '32px', rotate: `${entityAt=='item'?'0deg':'180deg'}`, scale:`${entityAt=='item'?'2':'2.5'}` }} /> : undefined}
            endDecorator={
              <Button disabled={!entities.includes(entityName)||!entities.includes(entityAt)} color="success" onClick={() => {
                getCommandResult(`minecraft:execute at @e[type=${entityAt}] run summon minecraft:${entityName} ~ ~ ~${entityName=="item"?' {Item:{id:"minecraft:'+entityitem+'",Count:1}}':''}`, (output: string) => {
                  setEntityMessage(output);
                  if(output.startsWith('Summoned new')) {
                    setEntityMessage(`Spawned ${entityName}${entityName=='item'?` (${entityitem})`:''} at every ${entityAt}'s location`);
                  }
                });
              }}>Spawn at every target</Button>
            } />
          </Sheet>
        </div>
      </main>
    </CssVarsProvider>
  );
}
