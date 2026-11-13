import {searchThrows} from './throw-search.js';
self.onmessage=({data})=>{
  const best=searchThrows(data.stone,data.start,data.count,progress=>self.postMessage({progress}));
  self.postMessage({done:true,best});
};
