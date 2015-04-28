var BluetoothScanner, spawn;

spawn = require('child_process').spawn;

BluetoothScanner = (function() {
  var filterHciDump, hciconfig, hcidump, hcitool, init, instance;

  instance = void 0;

  hciconfig = {};

  hcidump = {};

  hcitool = {};

  init = function(hcidev, callback) {
    
    // Bring selected device UP
    hciconfig = spawn('hciconfig', [hcidev, 'up']);
    
    return hciconfig.on("exit", function(code) {
      var clearHciTool, hciToolDev, hciToolScan;
      
      if (code !== 0) {
        
        // Could not get the device UP, maybe due to permissions, should run with sudo.
        throw new Error('hciconfig: failed to bring up device ' + hcidev +'. Try running with sudo');
      
      } else {
        
        console.log("hciconfig: succesfully brought up device " + hcidev);
        
        // Kill any previous hcitool command
        clearHciTool = spawn("killall", ["hcitool"]);
        
        clearHciTool.on("exit", function(code) {
         
          console.log("hcitool: killed (code " + code + ")");
          
          // Need to run this so scan returns actual results on Raspberry Pi devices
          hciToolDev = spawn('hcitool', ['dev']);
          
          return hciToolDev.on("exit", function(code) {
            
            if (code === 1) {
              
              return console.log("hcitool dev: exited, already running? (code 1)");
            
            } else {
              
              console.log("hcitool dev: done (code " + code + ")");
              
              // Start scan
              console.log("hcitool scan: started...");
              hciToolScan = spawn('hcitool', ['scan']);
              
              hciToolScan.on("exit", function(code) {
                
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
                  
                  return true;
                }
                
                return null;
              });
            }
          });
        });
      }
      return null;
    });
  };

  BluetoothScanner.prototype.destroy = function() {
    try {
      hcitool.kill();
      return hcitool.kill();
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
