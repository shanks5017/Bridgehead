'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const BaseFetcher = require('./baseFetcher');
const { fetchWithRetry } = require('../utils/httpClient');
const { buildGeoTag } = require('../utils/lgdMapper');
const logger = require('../utils/logger');

const CITIES = [
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, imdId: '43279' },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, imdId: '43230' },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946, imdId: '43295' },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, imdId: '43003' },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, imdId: '43128' },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090, imdId: '42182' },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, imdId: '42809' },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, imdId: '43063' },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, imdId: '42647' },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, imdId: '42357' },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, imdId: '42279' },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, imdId: '42667' },
];

function mapWeatherCode(code) {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 69) return 'Drizzle/Rain';
  if (code <= 79) return 'Snow';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

class WeatherFetcher extends BaseFetcher {
  getId() { return 'Weather'; }
  getTableName() { return 'gov_weather'; }
  getConflictTarget() { return ['station_id', 'observed_at']; }

  async fetchData() {
    const results = [];
    for (const city of CITIES) {
      try {
        const resp = await fetchWithRetry(
          {
            method: 'GET',
            url: 'https://api.open-meteo.com/v1/forecast',
            params: {
              latitude: city.lat, longitude: city.lon,
              current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
              hourly: 'temperature_2m,precipitation',
              timezone: 'Asia/Kolkata', forecast_days: 1,
            },
          },
          { retries: 4, baseDelay: 1000, module: `Weather[${city.name}]` }
        );
        const c = resp.data.current;
        const hourly = resp.data.hourly;
        const forecast24h = (hourly?.time || []).slice(0, 24).map((t, i) => ({
          time: new Date(t), temperatureC: hourly.temperature_2m[i], precipitationMm: hourly.precipitation[i],
        }));
        results.push({
          station_id: `openmeteo_${city.lat}_${city.lon}`,
          station_name: city.name,
          stateName: city.state,
          districtName: city.name,
          temperature_c: c.temperature_2m,
          humidity_pct: c.relative_humidity_2m,
          rainfall_mm: c.precipitation,
          wind_speed_kmh: c.wind_speed_10m,
          weather_condition: mapWeatherCode(c.weather_code),
          forecast_24h: forecast24h,
          source: 'open-meteo',
          observed_at: new Date(c.time).toISOString(),
        });
        logger.info(`[Weather] ✅ ${city.name}: ${c.temperature_2m}°C`);
      } catch (err) {
        logger.error(`[Weather] ❌ ${city.name}: ${err.message}`);
      }
    }
    return results;
  }

  transformRecord(raw) {
    return raw; // Already structured for DB
  }
}

module.exports = new WeatherFetcher();

if (require.main === module) {
  (async () => {
    const { connectDB, disconnectDB } = require('../config/db');
    await connectDB();
    const result = await module.exports.run();
    await disconnectDB();
    process.exit(result.status === 'success' ? 0 : 1);
  })();
}
