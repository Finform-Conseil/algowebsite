const fs=require("node:fs");const path=require("node:path");const test=require("node:test");const assert=require("node:assert/strict");
const root=process.cwd();const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const footer=read("components/technical-analysis/components/toolbar/drawing/DrawingToolbarFooter.tsx");
const picker=read("components/technical-analysis/components/toolbar/drawing/DrawingIconPicker.tsx");
const data=read("components/technical-analysis/components/toolbar/drawing/drawingIconPickerData.ts");
test("TradingView-scale icon picker is complete and scrollable",()=>{
 assert.match(footer,/<DrawingIconPicker/);assert.doesNotMatch(footer,/const ICON_FAMILIES/);
 assert.match(picker,/gridTemplateColumns:"repeat\(9,minmax\(0,1fr\)\)"/);assert.match(picker,/className=\{styles\.scrollArea\}/);assert.match(picker,/data-icon-picker-scroll/);assert.match(picker,/overflowY:"auto"/);assert.match(picker,/role="tablist"/);assert.match(picker,/"emojis","stickers","icons"/);
 for(const id of["smiles-people","animals-nature","food-drink","activities","travel-places","objects","symbols","flags"])assert.ok(data.includes('id: "'+id+'"')||data.includes('id:"'+id+'"'),"missing category "+id);
 assert.ok(data.length>5000,"emoji corpus regressed to a tiny sample");
});
