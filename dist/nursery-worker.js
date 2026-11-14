import {nextGeneration,traceTrial} from './nursery.js';
let founders,options,previous=null;
self.onmessage=({data})=>{
 try{
  if(data.founders){founders=data.founders;options=data.options;previous=null;}
  previous=nextGeneration(founders,previous,options);
  const {round,elite,challenger,kept}=previous;
  self.postMessage({round,kept,champion:elite.stone,result:elite.result,trial:traceTrial(challenger.stone,round,options.objective)});
 }catch(error){self.postMessage({error:error.message});}
};
