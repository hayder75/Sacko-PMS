import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const pr = new PrismaClient();
const ACCTS = [
  {a:'100001',n:'Abebe Kebede'},{a:'100002',n:'Almaz G/Hiwot'},{a:'100003',n:'Bekele Mamo'},
  {a:'100004',n:'Chaltu Hunde'},{a:'100005',n:'Dawit Lemma'},{a:'100006',n:'Eyerusalem Tilahun'},
  {a:'100007',n:'Fikirte Admasu'},{a:'100008',n:'Genet Wondimu'},{a:'100009',n:'Hiwot Belayneh'},
  {a:'100010',n:'Kidist Hailu'},{a:'100011',n:'Lemlem Gebre'},{a:'100012',n:'Mekdes Berhe'},
  {a:'100013',n:'Saba Tekle'},{a:'100014',n:'Tigist Desta'},{a:'100015',n:'Wubet Alemu'},
  {a:'100016',n:'Yordanos Tadesse'},{a:'100017',n:'Zewditu Molla'},{a:'100018',n:'Birtukan Yimer'},
  {a:'100019',n:'Tsehay Yohannes'},{a:'100020',n:'Meron Tesfaye'},{a:'100021',n:'Selam Adane'},
  {a:'100022',n:'Tsion Tadesse'},
];
async function main() {
  await pr.$connect();
  const admin = await pr.user.findUnique({where:{email:'admin@sako.com'}});
  const br = await pr.branch.findFirst({where:{code:'HAWASSA_MAIN'}});
  const bm = await pr.user.findUnique({where:{email:'abebe.tadesse@hawassa_main.et'}});
  const ms = await pr.user.findUnique({where:{email:'bekele.molla@hawassa_main.et'}});
  const ac = await pr.user.findUnique({where:{email:'almaz.worku@hawassa_main.et'}});
  const m1 = await pr.user.findUnique({where:{email:'chaltu.desta@hawassa_main.et'}});
  const m2 = await pr.user.findUnique({where:{email:'dawit.haile@hawassa_main.et'}});
  const m3 = await pr.user.findUnique({where:{email:'eyerusalem.tesfaye@hawassa_main.et'}});
  if(!br||!bm||!ms||!ac||!m1||!m2||!m3){console.error('Missing data');process.exit(1);}
  const bid=br.id, mids=[m1.id,m2.id,m3.id];
  const team = await pr.team.upsert({where:{code:'HAWASSA_MAIN-TEAM1'},update:{managerId:ms.id},create:{name:'Hawassa Main Team 1',code:'HAWASSA_MAIN-TEAM1',branchId:bid,managerId:ms.id}});
  await pr.subTeam.upsert({where:{code:'HAWASSA_MAIN-SUBTEAM1'},update:{leaderId:ac.id,members:{set:[{id:m1.id},{id:m2.id},{id:m3.id}]}},create:{name:'Hawassa Main Sub-Team 1',code:'HAWASSA_MAIN-SUBTEAM1',teamId:team.id,branchId:bid,leaderId:ac.id,members:{connect:[{id:m1.id},{id:m2.id},{id:m3.id}]}}});
  const prods=[['Medbegna Saving','Deposit_Mobilization'],['Felagot Saving','Deposit_Mobilization'],['Special Saving','Deposit_Mobilization'],['Super Saving','Deposit_Mobilization'],['Digital Saving','Digital_Channel_Growth'],['Share Account','Shareholder_Recruitment'],['Member Registration','Member_Registration'],['Sixty Days Loan','Loan_NPL']];
  for(const p of prods) await pr.productKpiMapping.upsert({where:{cbs_product_name:p[0]},update:{kpi_category:p[1],status:'active',mappedById:admin.id},create:{cbs_product_name:p[0],kpi_category:p[1],status:'active',mappedById:admin.id}});
  let mi=0; for(const a of ACCTS){const e=await pr.accountMapping.findFirst({where:{accountNumber:a.a}});if(!e){await pr.accountMapping.create({data:{accountNumber:a.a,customerName:a.n,accountType:'Active',balance:Math.random()*5000,june_balance:Math.random()*5000,current_balance:Math.random()*5000,active_status:true,mappedToId:mids[mi%3],branchId:bid,status:'Active'}});}mi++;}
  const tts=['Deposit_Mobilization','Loan_Follow_up','New_Customer','Digital_Activation','Member_Registration','Shareholder_Recruitment'];let tc=0;
  for(let d=0;d<14;d++){for(let t=0;t<4;t++){const r=Math.random();let st;if(r<0.4)st='Pending';else if(r<0.75)st='Approved';else st='Rejected';
    const td=new Date('2026-06-17');td.setDate(td.getDate()-d);td.setHours(8+Math.floor(Math.random()*8),Math.floor(Math.random()*60));
    const at=ACCTS[Math.floor(Math.random()*ACCTS.length)];const ai=mids[Math.floor(Math.random()*3)];
    const task=await pr.dailyTask.create({data:{taskType:tts[Math.floor(Math.random()*tts.length)],accountNumber:at.a,amount:Math.floor(Math.random()*9000)+1000,submittedById:ai,branchId:bid,mappingStatus:'Unmapped',approvalStatus:st,taskDate:td}});
    if(st!=='Pending'){await pr.taskApproval.create({data:{taskId:task.id,approverId:ms.id,role:'Manager',status:st,comments:st==='Approved'?'Completed':'Rejected',approvedAt:new Date(td.getTime()+3600000)}});}
    tc++;}}
  let xc=0; for(let i=0;i<20;i++){const at=ACCTS[Math.floor(Math.random()*ACCTS.length)];const xd=new Date();xd.setHours(8+Math.floor(Math.random()*9));await pr.transaction.create({data:{account_no:at.a,credit:Math.floor(Math.random()*5000)+100,debit:Math.floor(Math.random()*100),transaction_date:xd,branch_code:'HAWASSA_MAIN'}});xc++;}
  console.log('DONE: '+ACCTS.length+' accounts, '+tc+' tasks, '+xc+' transactions');
  await pr.$disconnect();
}
main().catch(e=>{console.error(e);pr.$disconnect();process.exit(1);});
