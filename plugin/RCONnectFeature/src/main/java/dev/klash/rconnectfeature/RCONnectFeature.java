package dev.klash.rconnectfeature;

import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public final class RCONnectFeature extends JavaPlugin {


    public static String httpGet(String urlToRead) {
        try {
            StringBuilder result = new StringBuilder();
            URL url = new URL(urlToRead);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream()))) {
                for (String line; (line = reader.readLine()) != null; ) {
                    result.append(line);
                }
            }
            return result.toString();
        }catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static String host;
    public static int port;

    @Override
    public void onEnable() {
        getLogger().info("RCONnectFeature enabled!");
        saveDefaultConfig();
        host = getConfig().getString("rconnect.host");
        port = getConfig().getInt("rconnect.port");
        getLogger().info("Host: " + host);
        getLogger().info("Port: " + port);

        String result = httpGet("http://" + host + ":" + port + "/");
        if(result.startsWith("{\"server\"")) {
            getLogger().info("Server is online!");
        } else {
            getLogger().info("Couldnt connect to RCONnect. Plugin wont disable - but features may throw errors.");
        }
    }

    @Override
    public void onDisable() {
        getLogger().info("RCONnectFeature disabled!");
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (label.equalsIgnoreCase("rconnect-inventory-data")) {
            if(args.length == 0) {
                sender.sendMessage("[RCONnect] Please provide a player name.");
                return true;
            }
            Player player = Bukkit.getPlayer(args[0]);
            if (player == null) {
                sender.sendMessage("[RCONnect]pnf");
                return true;
            }
            Inventory inv = player.getInventory();
//            Inventory data as a string array [0, 1, 2, ..., 35] (36 slots) containing just the material names (e.g. "diamond_sword")
            List<String[]> data = new ArrayList<>();
            for (int i = 0; i < 36; i++) {
                if (inv.getItem(i) != null) {
                    String[] itemData = new String[2];
                    itemData[0] = inv.getItem(i).getType().name().toLowerCase();
                    itemData[1] = String.valueOf(inv.getItem(i).getAmount());
                    data.add(itemData);
                }else {
                    String[] itemData = new String[2];
                    itemData[0] = "air";
                    itemData[1] = "0";
                    data.add(itemData);
                }
            }
            String body = data.stream()
                    .map(itemData -> "[\"" + String.join("\",\"", itemData) + "\"]")
                    .collect(Collectors.joining(",", "[", "]"));
            String result = httpGet("http://" + host + ":" + port + "/post-inventory?inv="+body);
            sender.sendMessage("[RCONnect]" + result);

            return true;
        }
        return false;
    }
}
