import { db } from "../src/lib/db";
async function main() {
  console.log("🌱 Seeding transparency data…");
  const ents = await db.enterprise.findMany();
  const ep = ents.find(e=>e.slug==="ecopack-solutions")!;
  const sb = ents.find(e=>e.slug==="street-bites")!;
  const nb = ents.find(e=>e.slug==="nile-brew-cafe")!;
  const sf = ents.find(e=>e.slug==="smartfarm-egypt")!;
  const us = await db.user.findMany();
  const la=us.find(u=>u.email==="layla@streetbites.eg")!;
  const ah=us.find(u=>u.email==="ahmed@ecopack.eg")!;
  const mo=us.find(u=>u.email==="mohamed@smartfarm.eg")!;
  const sa=us.find(u=>u.email==="sarah@investor.eg")!;
  const kh=us.find(u=>u.email==="khalil@holding.eg")!;
  const emps = await db.employee.findMany();
  for (const e of emps) { const n=`NOSI-${e.enterpriseId.slice(-4)}-${e.userId.slice(-4)}-${Math.floor(1000+Math.random()*9000)}`; await db.employee.update({where:{id:e.id},data:{nosiNumber:n}}); }
  await db.employee.createMany({data:[
    {enterpriseId:sb.id,userId:la.id,position:"Founder & Operator",department:"Operations",compensationBand:"8,000-12,000 EGP",monthlySalaryEgp:10000,nosiStatus:"registered",nosiNumber:"NOSI-SB-LAY-4471",nosiRegisteredAt:new Date("2026-01-15"),keyPerson:true},
    {enterpriseId:ep.id,userId:sa.id,position:"Board Observer",department:"Governance",compensationBand:"n/a",monthlySalaryEgp:0,nosiStatus:"registered",nosiNumber:"NOSI-EP-SAR-8821",nosiRegisteredAt:new Date("2025-12-01")},
    {enterpriseId:ep.id,userId:kh.id,position:"Board Chair",department:"Governance",compensationBand:"n/a",monthlySalaryEgp:0,nosiStatus:"registered",nosiNumber:"NOSI-EP-KHA-1193",nosiRegisteredAt:new Date("2025-11-15"),keyPerson:true},
    {enterpriseId:nb.id,userId:ah.id,position:"Board Member",department:"Governance",compensationBand:"n/a",monthlySalaryEgp:0,nosiStatus:"registered",nosiNumber:"NOSI-NB-AHM-5567",nosiRegisteredAt:new Date("2025-10-01")},
    {enterpriseId:sf.id,userId:mo.id,position:"CEO & Founder",department:"Executive",compensationBand:"45,000-60,000 EGP",monthlySalaryEgp:52000,nosiStatus:"registered",nosiNumber:"NOSI-SF-MOH-7732",nosiRegisteredAt:new Date("2025-09-01"),keyPerson:true},
    {enterpriseId:sf.id,userId:sa.id,position:"Board Member",department:"Governance",compensationBand:"n/a",monthlySalaryEgp:0,nosiStatus:"registered",nosiNumber:"NOSI-SF-SAR-2244",nosiRegisteredAt:new Date("2025-09-15")},
  ]});
  const qr=(e:string,q:string,y:number,r:number,c:number,o:number,g:number,m:number,b:number,es:number)=>db.quarterlyReport.create({data:{enterpriseId:e,quarter:q,year:y,revenueEgp:r,cogsEgp:c,grossProfitEgp:r-c,opexEgp:o,netProfitEgp:r-c-o,lawFirmClientAccountBalanceEgp:es,monthlyBurnEgp:b,runwayMonths:b>0?es/b:0,grossMarginPct:m,revenueGrowthPct:g,aiRiskFlag:m<20?"caution":"none",aiAssessment:`${q} ${y}: Revenue ${r.toLocaleString()} EGP. Margin ${m}%.`,ipfsCid:`Qm${Math.random().toString(36).slice(2,46)}`}});
  await qr(ep.id,"Q1",2026,2400000,1584000,800000,38,34,1600000,4200000);
  await qr(ep.id,"Q4",2025,1900000,1292000,720000,32,32,1450000,3800000);
  await qr(sb.id,"Q1",2026,180000,104400,60000,28,42,120000,180000);
  await qr(sb.id,"Q4",2025,140000,86800,50000,22,38,95000,145000);
  await qr(nb.id,"Q1",2026,6800000,4216000,2100000,24,38,4900000,12400000);
  await qr(nb.id,"Q4",2025,5500000,3520000,1800000,20,36,4200000,11200000);
  await qr(sf.id,"Q1",2026,38000000,22420000,12000000,46,41,24000000,0);
  await qr(sf.id,"Q4",2025,26000000,15860000,8500000,38,39,18000000,0);
  await db.vendor.createMany({data:[
    {enterpriseId:sb.id,name:"Cairo Fresh Wholesale",commercialRegister:"CR-22341",category:"supplies",totalPaidYtdEgp:84000,riskScore:8,relatedParty:false},
    {enterpriseId:ep.id,name:"Fresh Roast Trading",commercialRegister:"CR-33987",category:"logistics",totalPaidYtdEgp:150000,riskScore:78,relatedParty:true,uboOverlapNote:"Owned by Khalil family cousin"},
    {enterpriseId:nb.id,name:"Nile Valley Coffee Imports",commercialRegister:"CR-44120",category:"supplies",totalPaidYtdEgp:2400000,riskScore:18,relatedParty:false},
    {enterpriseId:sf.id,name:"Delta Irrigation Systems",commercialRegister:"CR-88901",category:"supplies",totalPaidYtdEgp:3200000,riskScore:14,relatedParty:false},
  ]});
  await db.whistleblowerReport.createMany({data:[
    {trackingCode:"WB-7X3F9-K2L8M",enterpriseId:nb.id,category:"conflict_of_interest",description:"Board member's logistics company invoices 30% above market.",credibilityScore:0.88,aiSummary:"Corroborated. Recommend forensic review.",status:"validated"},
    {trackingCode:"WB-9A2B7-C4D5E",enterpriseId:ep.id,category:"threshold_gaming",description:"10 expenses of 9,800 EGP over 14 days.",credibilityScore:0.92,aiSummary:"Pattern confirmed. Probability <0.1%.",status:"investigating"},
  ]});
  await db.appealCase.create({data:{filedById:sa.id,enterpriseId:nb.id,caseType:"expense_dispute",description:"Appeal against CRE-approved expense #EXP-4471.",feeEgp:500,stage:2,status:"human_panel",aiRuling:"CRE decision technically correct. Related-party flag raised post-approval.",precedentNote:"Related-party expenses require pre-approval disclosure."}});
  console.log("✅ Transparency seed complete.");
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>{await db.$disconnect()});
