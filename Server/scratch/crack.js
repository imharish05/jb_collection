const bcrypt = require('bcryptjs');

const targetHash = '$2a$10$mW5EWmZ6xDvP1vdjIsJMSOc4HIZGIo/tSfj0oa2C/iBWi5qFpE5xe';

// Generate a dictionary of candidate passwords
const baseWords = [
  'admin', 'Admin', 'kamali', 'Kamali', 'gift', 'gifts', 'Gift', 'Gifts',
  'factory', 'Factory', 'harish', 'Harish', 'saitechno', 'Saitechno', 'SaiTechno',
  'washington', 'wires', 'washingtonwires', 'techno', 'Techno', 'password', 'Password',
  'stsmail', 'stsmail2025', 'oytgejyhcszlozkh', 'vsornamambiga'
];

const separators = ['', '@', '_', '-', '#', '$', '!', '&', ' '];
const numbers = ['', '123', '1234', '123456', '12345678', '2025', '2026', '2024', '1', '2', '3', '05082004', '96'];

const candidates = new Set([
  // Specific potential passwords from settings
  'Admin@123', 'admin@2026', 'admin', 'admin123', 'password',
  'kamali', 'kamaligifts', 'Kamali@123', 'KamaliGifts', 'Kamali_Gifts',
  'kamaligiftsfactory', 'kamaligifts@2026', 'harish', 'harish05082004',
  'harishsangaran96', 'stsmail2025', 'oytgejyhcszlozkh', '&7vPcia#n4',
  'Admin', 'root', 'Kamali@2026', 'KamaliGifts@2026', 'Kamali@2025',
  'admin@2025', 'admin1234', '12345678', '123456', 'kamali@123', 'Kamali',
  'KamaliGiftsFactory', 'KamaliGiftsFactory@2026', 'KamaliGiftsFactory@123',
  'M&#0m^gA%&s9ZRmJEIrl$4D%J9QP6GsA', 'Home', 'Kanchipuram', 'Tamil Nadu', '600127'
]);

// Build more combinations
for (const word of baseWords) {
  candidates.add(word);
  candidates.add(word.toLowerCase());
  candidates.add(word.toUpperCase());
  
  // word + number
  for (const num of numbers) {
    candidates.add(word + num);
    candidates.add(word.toLowerCase() + num);
    candidates.add(word.toUpperCase() + num);
  }
  
  // word + separator + number
  for (const sep of separators) {
    for (const num of numbers) {
      if (num !== '') {
        candidates.add(word + sep + num);
        candidates.add(word.toLowerCase() + sep + num);
        candidates.add(word.toUpperCase() + sep + num);
      }
    }
  }
}

// Add some multi-word combos like kamaliGifts, kamaliGiftsFactory
const compoundWords = [
  'kamaligifts', 'KamaliGifts', 'kamaligiftsfactory', 'KamaliGiftsFactory',
  'saitechnology', 'saitechno', 'SaiTechno', 'washingtonwires'
];

for (const cw of compoundWords) {
  candidates.add(cw);
  for (const num of numbers) {
    candidates.add(cw + num);
  }
  for (const sep of separators) {
    for (const num of numbers) {
      if (num !== '') {
        candidates.add(cw + sep + num);
      }
    }
  }
}

console.log(`Testing ${candidates.size} candidate passwords against hash: ${targetHash}`);

let found = false;
let count = 0;
const list = Array.from(candidates);

for (const cand of list) {
  count++;
  if (count % 200 === 0) {
    console.log(`Progress: Checked ${count}/${list.length} candidates...`);
  }
  if (bcrypt.compareSync(cand, targetHash)) {
    console.log('\n=========================================');
    console.log('🎉 MATCH FOUND! PASSWORD IS: ' + cand);
    console.log('=========================================\n');
    found = true;
    break;
  }
}

if (!found) {
  console.log('\n❌ No match found in candidate dictionary.');
}
