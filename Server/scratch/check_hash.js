const bcrypt = require('bcryptjs');
const hash = '$2a$10$AiTPtg9AVBo0OzXeEJ37sOBNqNE2W2nQJ6exqso7UqlS79fwhRjhS';
const candidates = [
  'Admin@123', 'admin@2026', 'admin', 'admin123', 'password',
  'kamali', 'kamaligifts', 'Kamali@123', 'KamaliGifts', 'Kamali_Gifts',
  'kamaligiftsfactory', 'kamaligifts@2026', 'harish', 'harish05082004',
  'harishsangaran96', 'stsmail2025', 'oytgejyhcszlozkh', '&7vPcia#n4',
  'Admin', 'root', 'Kamali@2026', 'KamaliGifts@2026', 'Kamali@2025',
  'admin@2025', 'admin1234', '12345678', '123456', 'kamali@123',
  'Kamali'
];

let found = false;
for (const cand of candidates) {
  if (bcrypt.compareSync(cand, hash)) {
    console.log('MATCH FOUND: ' + cand);
    found = true;
    break;
  }
}
if (!found) {
  console.log('No match found in common list');
}
