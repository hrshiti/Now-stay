const fs = require('fs');
const files = [
  'AddHotelWizard.jsx',
  'AddResortWizard.jsx',
  'AddHostelWizard.jsx',
  'AddPGWizard.jsx',
  'AddVillaWizard.jsx',
  'AddHomestayWizard.jsx',
  'AddTentWizard.jsx',
  'PartnerJoinPropertyType.jsx'
];
const dir = 'd:/hritik sir/Now-stay/frontend/src/app/partner/pages/';
let count = 0;
for (const file of files) {
  const path = dir + file;
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    const oldStr = '<div className="min-h-screen bg-gray-50 flex flex-col font-sans">';
    const newStr = '<div className="h-[100dvh] bg-gray-50 flex flex-col font-sans overflow-y-auto overflow-x-hidden hide-scrollbar">';
    if (content.includes(oldStr)) {
      content = content.replace(oldStr, newStr);
      fs.writeFileSync(path, content);
      console.log('Fixed ' + file);
      count++;
    }
  }
}
console.log('Total fixed: ' + count);
