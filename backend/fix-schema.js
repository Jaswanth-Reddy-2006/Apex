const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

content = content.replace(/@db\.ObjectId/g, '');
content = content.replace(/@default\(auto\(\)\)/g, '@default(uuid())');

fs.writeFileSync(schemaPath, content);
console.log('Schema updated.');
