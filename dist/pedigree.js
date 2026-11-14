import {TYPES} from './data.js';

// Material and surface rules belong to this fictional collection.
// IDs follow the collection catalogue, including the four recruitable residents.
const stock = [
  'shore','shore','shore','tide','kitchen','sky','shore','desk','tide','desk','kitchen','bath',
  'sky','metal','tide','neighbor','desk','metal','kitchen','neighbor','kitchen','neighbor','tide','neighbor'
];
const substrates = {
  shore: ['veins', .33, .24], tide: ['waves', .24, .55], kitchen: ['crumb', .80, .12],
  desk: ['grid', .26, .42], sky: ['spark', .53, .48], bath: ['waves', .08, .95],
  metal: ['grid', .58, .18], neighbor: ['veins', .51, .28]
};
const patterns = {veins:'层理细纹', waves:'水纹釉', crumb:'蜂窝孔眼', grid:'方格压纹', spark:'晶点', glaze:'薄釉斑'};
// The first matching recipe sets the child's finish. Ties use this fixed order,
// so the same collection of parents has the same story in any UI order.
const recipes = [
  ['desk kitchen shore','河湾早餐机','按下去的一面烙出方格，朝水的一面仍记得河湾的弧度。早餐机坚持把第一漂叫作「弹出吐司」。','grid', .07, .06],
  ['desk kitchen','回车烤盘','黄油填进键缝，烤盘打印出一条食谱：按一下，翻个面，再弹起来。','grid', .06, .04],
  ['kitchen tide','潮汐烤饼','退潮给饼边刻了一圈浪纹，涨潮又替它洗掉了浮在表面的面包屑。','waves', -.12, .10],
  ['bath kitchen','泡泡糕','一个亲本负责打泡，另一个负责烘焙。切开的小孔里全是没来得及吹走的泡泡。','crumb', .13, .12],
  ['desk sky','星盘存档','天上掉下的一束星光，被存进了表面的小方格。每次碰水，它就想自动保存。','spark', -.04, .10],
  ['metal sky','轨道垫圈','星尘钻进磨痕，亮起一圈微小的铆钉。研究员坚持说这是颗有螺纹的小行星。','spark', .06, .09],
  ['desk tide','潮声录音带','一位亲本留下方格，另一位把海潮录了进去。侧过来听，里面全是扑通声。','waves', -.07, .08],
  ['desk metal','会响的算盘','齿纹对齐线路后，背面多了一排小格。它每漂一下，就给自己拨一颗算珠。','grid', .09, .02],
  ['kitchen metal','口袋华夫炉','金属的压纹困住了点心的碎屑，第一炉华夫石刚出锅就想跳进水里。','grid', .12, -.05],
  ['shore kitchen','河床千层酥','碎屑钻进石纹，河水把每层酥皮压出一道弧。它说自己天生适合在水面翻页。','veins', .07, .04],
  ['kitchen sky','星屑饼','面团收下了一把星屑。掰不开这块饼，却能在切面上数出小小的星座。','spark', .10, .03],
  ['kitchen neighbor','散步饭团','河岸住民把点心裹在一件有小孔的外衣里，打算在下一次落水前吃上一口。','crumb', .09, -.05],
  ['bath metal','泡沫轴承','皂膜流进了磨痕，旧零件终于安静下来。只是每转三圈，还是会打一个肥皂嗝。','glaze', -.14, .15],
  ['bath tide','浪花肥皂盒','海浪盖上透明的釉，肥皂躲进最滑的一层。每次落水都像洗了一次澡。','waves', -.10, .17],
  ['bath desk','防水按键','肥皂给按键罩了一层薄膜。研究员还没按下去，它已经滑到水槽另一头。','glaze', -.10, .13],
  ['bath shore','打蜡鹅卵石','石纹兜住一层皂釉，水一碰就滑过去。研究员把它列为水槽里最难捞的一块。','glaze', -.12, .16],
  ['sky tide','海底星图','潮纹绕着晶点画出一幅星图，只有拿到水面上，地图才肯翻开。','spark', -.03, .11],
  ['shore tide','潮汐书签','两条岸边的水纹在同一块石头上会合，各自把弯折的地方当作书签。','waves', -.09, .06],
  ['metal shore','河床钟摆','河床磨圆了钟摆的一侧，另一侧还留着刻度。它决定用水漂来计时。','veins', .04, .04],
  ['desk shore','口袋读卡器','石层顺着键纹排好，一道波纹就能读出今天的河况。','grid', -.04, .05],
  ['shore sky','流星砚','陨光落进石纹，晕开一方亮晶晶的砚台。第一滴墨水被它打了个水漂。','spark', .03, .08],
  ['neighbor tide','海边传声筒','水纹里藏进了河岸住民的悄悄话，碰到下一圈涟漪才肯说出来。','waves', -.03, .05],
  ['neighbor desk','下班打卡石','那天最后一声打卡留在表面的格子里。以后每一次落水，都算准点下班。','grid', .04, .05],
  ['metal tide','浪花扳手','潮水给磨痕挖了细槽。碰上拧不开的浪花，它就转一圈。','waves', .06, .04],
  ['metal neighbor','袖珍修理铺','河岸住民接过一排磨齿，在接缝边挂出招牌：专修不会漂的烦恼。','grid', .08, -.03],
  ['neighbor sky','流星邮差','夜空留下一点亮晶晶的邮戳。河岸邮差坚持说这封信得从水面寄。','spark', -.02, .07],
  ['neighbor shore','河岸靠背椅','住民修圆了靠背，老石头留下扶手。开会时它爱一边漂一边打盹。','veins', -.06, .03],
  ['neighbor bath','泡泡澡堂','住民在釉面开了间澡堂，门口的小旗只有在碰水时才升起来。','glaze', -.08, .13],
  ['bath sky','月光镜','晶点上浮着皂膜，一点点光就能照亮它的整张脸。','spark', -.08, .15]
];
const sameFamily = {
  shore:['河床年轮','不同的石纹在外缘接好，水从纹路里翻过它们共写的年历。'],
  kitchen:['碎屑同盟','最酥的一层负责发出脆响，最滑的一层负责趁机逃下餐桌。'],
  desk:['备用键盘','两排纹路接上了同一条回路。它打算在水面敲出一封辞职信。'],
  tide:['潮水双声部','一圈水纹唱上声部，另一圈负责在下一个落点接唱。'],
  sky:['口袋流星雨','晶点在磨痕里扎营，又约好下一漂一起从天空回来。'],
  bath:['水槽滑梯','好多层皂膜挤在一起，最上面那层已经滑出实验台。'],
  metal:['码头发条','旧刻痕咬合成一架小发条，转两下，它就开始向水面报时。'],
  neighbor:['河岸议事会','每条边都要发言。大家投票决定，先一起在水上跳一圈。']
};
const fallback = ['口袋拼布','亲本把各自的边角拼在一起，接缝里还看得出每一位的手艺。'];
const bounded = value => Math.max(0, Math.min(1, value));
const category = stone => stock[stone.id] || 'shore';
const names = new Set([...recipes.map(r => r[1]), ...Object.values(sameFamily).map(r => r[0]), fallback[0]]);
export const knownStoryTitle = title => names.has(title);

function recipeFor(parents) {
  const groups = [...new Set(parents.map(category))].sort();
  const recipe = recipes.find(r => r[0].split(' ').every(k => groups.includes(k)));
  if (recipe) return recipe.slice(1);
  const [title,text] = groups.length === 1 ? sameFamily[groups[0]] : fallback;
  return [title,text,substrates[groups[0]][0], .015, .025];
}

export function familyStory(parents) {
  if (!parents?.length) return {title:'',text:''};
  const [title,text] = recipeFor(parents);
  const authors = parents.map(p => knownStoryTitle(p.name) ? p.name : TYPES[p.id].name).sort();
  const notes = ['把边缘的接缝压平','在侧面留了一道浅槽','把最亮的一面转向水面','在孔眼旁藏了一道记号'];
  const extras = authors.slice(2).map((name,i) => `${name}${notes[i]}`).join('，');
  return {title, text:`${authors[0]}${authors[1]?'和'+authors[1]:''}合写。 ${text}${extras?' '+extras+'。':''}`};
}

export function surfaceOf(stone) {
  const [pattern,grain,glaze] = substrates[category(stone)];
  const s = stone.surface;
  if (s && Object.hasOwn(patterns,s.pattern) && Number.isFinite(s.grain) && Number.isFinite(s.glaze)) {
    return {pattern:s.pattern, grain:bounded(s.grain), glaze:bounded(s.glaze)};
  }
  return {pattern,grain,glaze};
}
export function surfaceLabel(stone) {
  const s = surfaceOf(stone);
  return `${patterns[s.pattern]} · 颗粒 ${Math.round(s.grain*100)}% · 釉面 ${Math.round(s.glaze*100)}%`;
}

export function inheritSurface(parents,source,random) {
  const finishes = parents.map(surfaceOf);
  const parentMean = field => finishes.reduce((sum,s) => sum+s[field],0)/finishes.length;
  const blend = field => finishes[source][field]*.5 + parentMean(field)*.5;
  const main = recipeFor(parents);
  // Every pairing in a three-to-six-parent batch contributes a finish.
  // The principal recipe also contributes, so the three-material breakfast
  // machine retains some of its distinct finish among the pairwise reactions.
  const reactions = [main];
  if(parents.length>2){
    for(let i=0;i<parents.length-1;i++)for(let j=i+1;j<parents.length;j++){
      reactions.push(recipeFor([parents[i],parents[j]]));
    }
  }
  const pattern = random() < .65 ? main[2] : finishes[source].pattern;
  const strength = .55 + .45*random();
  const change = index => strength * reactions.reduce((sum,r)=>sum+r[index],0)/reactions.length;
  const grain = bounded(blend('grain') + change(3));
  const glaze = bounded(blend('glaze') + change(4));
  // Rough pits catch water; a glaze bridges them. The parent finish is already
  // in its live smoothness, so only the *change* in the finish is counted.
  const smoothnessDelta = .26*(glaze-blend('glaze'))-.18*(grain-blend('grain'));
  return {surface:{pattern,grain,glaze},smoothnessDelta};
}
