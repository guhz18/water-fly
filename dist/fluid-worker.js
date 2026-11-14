import {searchThrows} from './throw-search.js';
self.onmessage=({data})=>{
  const best=searchThrows(data.stone,data.start,data.count,progress=>self.postMessage({progress}),data.objective);
  self.postMessage({done:true,best});
};
