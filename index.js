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
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var BluetoothScanner = module.exports = function(hcidev) {
  var self = this;
  
  // Inherit EventEmitter
  EventEmitter.call(self);
  

  self.init = function(hcidev) {
    var tool_path = "";
    if (hcidev === 'fake') {
      tool_path = './';
    }
    
    // Bring selected device UP
    var hciconfig = spawn(tool_path + 'hciconfig', [hcidev, 'up']);
    
    hciconfig.on("exit", function(code) {
      
      if (code !== 0) {
        
        // Could not get the device UP, maybe due to permissions, should run with sudo.
        self.emit('error','hciconfig: failed to bring up device ' + hcidev +'. Try running with sudo.');
        return;
      
      } else {
        
        console.log("hciconfig: succesfully brought up device " + hcidev);
        
        // Kill any previous hcitool command
        var clearHciTool = spawn("killall", ["hcitool"]);
        
        clearHciTool.on("exit", function(code) {
         
          console.log("hcitool: killed (code " + code + ")");
          
          // Need to run this so scan returns actual results on Raspberry Pi devices
          var hciToolDev = spawn(tool_path + 'hcitool', ['dev']);
          
          hciToolDev.on("exit", function(code) {
            
            if (code === 1) {
              
              self.emit('error', 'hcitool dev: exited, already running? (code 1)');
              return;
            
            } else {
              
              console.log("hcitool dev: done (code " + code + ")");
              
              // Start scan
              var hciToolScan = spawn(tool_path + 'hcitool', ['scan']);
              console.log("hcitool scan: started...");

              hciToolScan.stdout.on('data', function(data) {

                if ( data.length ) {

                  data = data.toString('ascii');

                  var result;
                  var re = /((?:[0-9A-F]{2}(?::|)){6})[\t\s]+([^\n\r]+)/gmi;

                  while( (result = re.exec(data)) ) {
                    self.emit('device', result);
                  }

                }

              });
              
              hciToolScan.on("exit", function(code) {
                
                self.emit('done',"hcitool scan: exited (code " + code + ")");
                
              });

            }
          });
        });
      }
    });
  };
  
  self.init(hcidev);
};
util.inherits(BluetoothScanner, EventEmitter);
