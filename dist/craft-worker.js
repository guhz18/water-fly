import {searchCraft} from './craft-search.js';
self.onmessage=({data})=>{try{self.postMessage({done:true,best:searchCraft(data.id,data.stone,data.objective,data.options)});}catch(e){self.postMessage({error:e.message});}};
