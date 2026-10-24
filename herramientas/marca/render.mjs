// node render.mjs in.svg out.png width [bg]
import { createRequire } from 'node:module';
const require = createRequire('/home/claude/web/app/package.json');
const sharp = require('sharp');
const [,,inp,out,w,bg]=process.argv;
let img=sharp(inp,{density:1200}).resize({width:+w});
if(bg) img=img.flatten({background:bg});
await img.png().toFile(out);
