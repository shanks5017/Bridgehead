import fs from 'fs';
import * as cheerio from 'cheerio';

const data = JSON.parse(fs.readFileSync('jd_dom.json', 'utf8'));
const $ = cheerio.load(data.html);

const results = {
  title: $('h1').text().trim(),
  ratingClasses: $('.jd_rating').text().trim(),
  votesClasses: $('.jd_votes').text().trim(),
  greenBox: $('.green-box').text().trim(),
  overview: $('#overview').text().substring(0, 100),
  allText: $('div').map((i, el) => $(el).text()).get().filter(t => t.includes('Overview')).slice(0, 2).map(t => t.substring(0, 100)),
  imgs: $('img').map((i, el) => $(el).attr('src') || $(el).attr('data-src')).get().filter(src => src && !src.includes('data:') && !src.includes('icon')).slice(0, 15)
};

fs.writeFileSync('analysis_results.json', JSON.stringify(results, null, 2));
