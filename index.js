/**
 * Bluetooth scanner using Bluez tools
 * Only Bluez supported platforms are supported by this module
 *
 * Based on BLE-Scanner from Martin Gradler
 * 
 * Author: Pedro Paixao
 * License: MIT
 */
var spawn = require('child_process').spawn;

var BluetoothScanner = (function() {
  var hciconfig, hciToolScan, init, instance;

  instance = void 0;

  hciconfig = {};

  init = function(hcidev, callback) {
    
    var tool_path = "";
    if (hcidev === 'fake') {
      tool_path = './';
    }
    
    // Bring selected device UP
    hciconfig = spawn(tool_path + 'hciconfig', [hcidev, 'up']);
    
    return hciconfig.on("exit", function(code) {
      var clearHciTool, hciToolDev;
      
      if (code !== 0) {
        
        // Could not get the device UP, maybe due to permissions, should run with sudo.
        throw new Error('hciconfig: failed to bring up device ' + hcidev +'. Try running with sudo.');
      
      } else {
        
        console.log("hciconfig: succesfully brought up device " + hcidev);
        
        // Kill any previous hcitool command
        clearHciTool = spawn("killall", ["hcitool"]);
        
        return clearHciTool.on("exit", function(code) {
         
          console.log("hcitool: killed (code " + code + ")");
          
          // Need to run this so scan returns actual results on Raspberry Pi devices
          hciToolDev = spawn(tool_path + 'hcitool', ['dev']);
          
          return hciToolDev.on("exit", function(code) {
            
            if (code === 1) {
              
              return console.log("hcitool dev: exited, already running? (code 1)");
            
            } else {
              
              console.log("hcitool dev: done (code " + code + ")");
              
              // Start scan
              console.log("hcitool scan: started...");
              hciToolScan = spawn(tool_path + 'hcitool', ['scan']);
              
              return hciToolScan.on("exit", function(code) {
                
                console.log("hcitool scan: exited (code " + code + ")");
                return instance = void 0;
              
              });
              
              return hciToolScan.stdout.on('data', function(data) {
                
                if ( data.length ) {
                  
                  data = data.toString('ascii');
                  
                  var result;
                  var re = /((?:[0-9A-F]{2}(?::|)){6})[\s\t]+(\w*)/gi;
                  
                  while( (result = re.exec(data)) ) {
                    callback(result[1], result[2]);
                  }
                  
                }
                
              });
            }
          });
        });
      }
    });
  };

  BluetoothScanner.prototype.destroy = function() {
    try {
      return hcitoolScan.kill();
    } finally {
      instance = void 0;
    }
  };

  function BluetoothScanner(hcidev, callback) {
    if (!instance) {
      instance = init(hcidev, callback);
    }
    return instance;
  }

  return BluetoothScanner;

})();

module.exports = BluetoothScanner;
