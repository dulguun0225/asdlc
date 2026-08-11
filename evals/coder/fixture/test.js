const assert = require('node:assert');
const slugify = require('./slugify');

assert.strictEqual(slugify('Hello World'), 'hello-world');
assert.strictEqual(slugify('  Multiple   Spaces  '), 'multiple-spaces');
assert.strictEqual(slugify('already-slugged'), 'already-slugged');
console.log('ok');
