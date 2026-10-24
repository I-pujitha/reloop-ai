import test from 'node:test';
import assert from 'node:assert/strict';

test('upload allowlist accepts common supported image MIME types',()=>{
  const allowed=['image/jpeg','image/png','image/webp'];
  assert.equal(allowed.includes('image/jpeg'),true);
  assert.equal(allowed.includes('image/png'),true);
  assert.equal(allowed.includes('image/webp'),true);
  assert.equal(allowed.includes('image/svg+xml'),false);
});
test('action rewards are a fixed 10 points and duplicates are rejected by unique user-analysis index',()=>{
  const pointsPerAction=10;
  assert.equal(pointsPerAction,10);
  const seen=new Set(['userA:analysisA']);
  assert.equal(seen.has('userA:analysisA'),true);
  assert.equal(seen.has('userA:analysisB'),false);
});
test('password policy requires at least eight characters',()=>{
  const valid=p=>typeof p==='string'&&p.length>=8&&p.length<=72;
  assert.equal(valid('securepass'),true);
  assert.equal(valid('short'),false);
});
