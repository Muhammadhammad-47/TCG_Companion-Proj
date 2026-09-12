const fs = require('fs');
let content = fs.readFileSync('src/game/data/characters.js', 'utf8');

// Add appliesStun to Katsumi's Shadow Purr
content = content.replace(
  /(id:\s*'k_purr'[\s\S]*?desc:\s*')(.+?)(')/,
  "$1$2 On successful hit, defender falls asleep and loses 1 turn.$3,\n        appliesStun: true"
);

// Update all wild3 moves to be Super attacks
content = content.replace(
  /(id:\s*'\w+_wild3'[\s\S]*?costET:\s*)1,/g,
  "$12,\n        isSuper: true,"
);

fs.writeFileSync('src/game/data/characters.js', content);
console.log('Update successful');
