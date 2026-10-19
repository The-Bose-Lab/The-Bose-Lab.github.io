import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prerenderArticle} from '../scripts/prerender-article.mjs';
const source=await readFile('content/normalizing-flow-maps.html','utf8');
const html=await prerenderArticle(source.replaceAll('.gif"','.webp"'));
assert.equal((html.match(/class="katex"/g)||[]).length,(source.match(/class="math (?:inline|display)"/g)||[]).length,'Every original equation is ready without browser JavaScript');
assert.deepEqual([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]),[...source.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]),'Article anchors remain intact');
assert.equal((html.match(/<video /g)||[]).length,2);
for(const tag of html.matchAll(/<video[^>]+>/g)){assert(tag[0].includes('preload="none"'));assert(!/\ssrc=/.test(tag[0]),'Long loops must not download during article startup');assert(tag[0].includes('playsinline'));}
for(const loop of JSON.parse(await readFile('tests/fixtures/article-video-report.json','utf8'))){assert(loop.video_bytes<loop.source_bytes*.7);assert(loop.max_frame_mean_rgb_error<2);}
console.log('All article equations are pre-rendered; full-detail video loops defer loading and retain original anchors.');
