# Bluetooth-Scanner
An easy to use bluetooth scanner for node. Requires a Linux OS with bluez stack tools (hciconfig, hcitool, hcidump) to be installed.

## Usage
The bluetooth-scanner is designed as a singleton class. It can be used as followed:

    #require module
    Scanner = require("bluetooth-scanner");

    # define input
    var device = "hci0";
    
    # Scan for devices
    bleScanner = new Scanner(device, function(mac, name) {
        console.log('Found device: ' + name);
    });


The callback function will be called for each device found.

# Credits

Based on BLE-Scanner from Martin Gradler

# License

MIT