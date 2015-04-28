var BluetoothScanner, spawn;

spawn = require('child_process').spawn;

BluetoothScanner = (function() {
  var filterHciDump, hciconfig, hcidump, hcitool, init, instance;

  instance = void 0;

  hciconfig = {};

  hcidump = {};

  hcitool = {};

  init = function(hcidev, callback) {
    
    hciconfig = spawn('hciconfig', [hcidev, 'up']);
    
    return hciconfig.on("exit", function(code) {
      var clearHciTool, hciToolDev, hciToolScan;
      
      if (code !== 0) {
        
        return console.log("HCICONFIG: failed to bring up device " + hcidev);
      
      } else {
        
        console.log("HCICONFIG: succesfully brought up device " + hcidev);
        clearHciTool = spawn("killall", ["hcitool"]);
        
        clearHciTool.on("exit", function(code) {
          console.log("KILL HCITOOL: cleared (code " + code + ")");
          hciToolDev = spawn('hcitool', ['dev']);
          
          return hciToolDev.on("exit", function(code) {
            
            if (code === 1) {
              
              return console.log("HCITOOL DEV: exited, already running? (code 1)");
            
            } else {
              
              console.log("HCITOOL DEV: exited (code " + code + ")");
              hciToolScan = spawn('hcitool', ['scan']);
              
              hciToolScan.on("exit", function(code) {
                
                console.log("SCAN: exited (code " + code + ")");
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
    instance;
  }

  filterHciDump = function(output) {
    output = output.replace(/(\r\n|\n|\r)/gm, "");
    output = output.replace(/\s+/g, " ");
    return output = output.split(" ");
  };

  return BluetoothScanner;

})();

module.exports = BluetoothScanner;
