// Prints a route's captured DOM with repeated siblings collapsed and svg/img payloads shortened.
import fs from 'node:fs'; import * as cheerio from 'cheerio'; import beautify from 'js-beautify';
const f = process.argv[2], keep = +(process.argv[3]||2);
const $ = cheerio.load(fs.readFileSync(f,'utf8'), null, false);
$('svg').each((_,e)=>{ const s=$(e); const n=s.find('*').length; if(n>3){ s.html(`<!-- ${n} nodes -->`);} });
$('path').each((_,e)=>{ const d=$(e).attr('d'); if(d&&d.length>40) $(e).attr('d', d.slice(0,30)+'…'); });
$('img').each((_,e)=>{ const s=$(e).attr('src')||''; if(s.length>80) $(e).attr('src', s.slice(0,70)+'…'); $(e).removeAttr('srcset'); });
$('*').each((_,e)=>{ const kids=$(e).children(); if(kids.length>keep+2){ const sig=k=>k.tagName+'|'+($(k).attr('class')||''); const first=sig(kids[0]); let same=0; kids.each((_,k)=>{ if(sig(k)===first) same++; }); if(same>=kids.length-2 || kids.length>12){ const total=kids.length; kids.slice(keep).remove(); $(e).append(`<!-- +${total-keep} more siblings -->`);} } });
console.log(beautify.html($.html(),{indent_size:1,wrap_line_length:0,inline:[]}));
