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
    const oldStr = '<main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-32">';
    const newStr = '<main className="flex-1 w-full max-w-2xl mx-auto p-4 md:px-6 md:pt-6 pb-32 md:pb-32">';
    if (content.includes(oldStr)) {
      content = content.replace(oldStr, newStr);
      fs.writeFileSync(path, content);
      console.log('Fixed padding in ' + file);
      count++;
    }
  }
}
console.log('Total fixed padding: ' + count);
