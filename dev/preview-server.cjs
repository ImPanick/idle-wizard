// Local development preview. Only the game document is served, on loopback.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const game=path.join(__dirname,'..','ascii-idle-wizard.html');
http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://127.0.0.1').pathname;
  if(pathname!=='/'&&pathname!=='/ascii-idle-wizard.html'){
    response.writeHead(404,{'Content-Type':'text/plain'});response.end('Not found');return;
  }
  response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  response.end(fs.readFileSync(game));
}).listen(8765,'127.0.0.1',()=>console.log('Game preview ready at http://127.0.0.1:8765/'));
