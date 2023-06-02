import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
const app = express();
const port = 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import request from 'request';
 
function getIPAddress() { 
  return new Promise((resolve, reject) => {
    request('https://api.ipify.org/?format=json', { json: true }, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (response.statusCode !== 200) {
        reject(new Error(`Failed to retrieve IP address. Status code: ${response.statusCode}`));
      } else {
        resolve(body.ip);
      }
    });
  });
}
var myip;
getIPAddress()
      .then(ipAddress => {
        console.log('Your IP address:', ipAddress);
        myip=ipAddress;
       })
       .catch(error => {
        console.error('Error retrieving IP address:', error);
      });
app.use(express.static('public')); 
// Route handler for the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
// Route handler for the tracert
app.get('/trace-route', (req, res) => {
  const ipAddress = req.query.ip;

  if (!ipAddress) {
    res.status(400).json({ error: 'IP address parameter is missing' });
    return; 
  }
  // Run tracert command
  exec(`tracert -d -w 1000 ${ipAddress}`, (error, stdout, stderr) => {
    console.log(stdout);
    if (error) {
      console.error('An error occurred while running tracert:', error);
      res.status(500).json({ error: 'Failed to run tracert' });
      return;
    }
  // Split the output into lines
  const lines = stdout.split('\n');
  // Define the regular expression pattern to match the desired element
  const regex = /(\d+)\s+(\d+ ms)\s+(\d+ ms)\s+(\d+ ms)/;
  var lastLine;
  // Process each line and extract the desired element
  for (let line of lines) {
    const match = line.match(regex);
    if (match) {
      const hopNumber = match[1];
      const latency1 = match[2];
      const latency2 = match[3];
      const latency3 = match[4];
      // Use the extracted elements as needed
      console.log(`Hop ${hopNumber}: ${latency1}, ${latency2}, ${latency3}`);
      lastLine = `|| Ping: ${latency3} || Your IP: ${myip} ||`;
    }
  }  
    res.send(lastLine);
  });
}); 
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
