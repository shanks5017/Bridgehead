import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client using environment variables from Zonek backend
const supabaseUrl = process.env.SUPABASE_URL || 'https://mbnghnngneemcqnnsiny.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

// Helper to fetch records from a table safely
async function fetchTable(tableName: string, limit = 100) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(limit);
  if (error) throw error;

  if (!data || data.length === 0) return [];

  try {
    const hasStateId = data[0].hasOwnProperty('state_id');
    const hasDistrictId = data[0].hasOwnProperty('district_id');

    if (hasStateId || hasDistrictId) {
       const [ statesRes, districtsRes ] = await Promise.all([
         hasStateId ? supabase.from('gov_states').select('id, name') : Promise.resolve({data: null}),
         hasDistrictId ? supabase.from('gov_districts').select('id, name') : Promise.resolve({data: null})
       ]);

       const states = statesRes.data || [];
       const districts = districtsRes.data || [];

       const stateMap: Record<string, string> = {};
       const districtMap: Record<string, string> = {};

       states.forEach((s: any) => { if (s && s.id) stateMap[s.id] = s.name; });
       districts.forEach((d: any) => { if (d && d.id) districtMap[d.id] = d.name; });

       return data.map((item: any) => ({
         ...item,
         ...(hasStateId && item.state_id && stateMap[item.state_id] ? { state_name: stateMap[item.state_id] } : {}),
         ...(hasDistrictId && item.district_id && districtMap[item.district_id] ? { district_name: districtMap[item.district_id] } : {})
       }));
    }
  } catch (err) {
    console.error('[Gov Data] Error mapping state/district names:', err);
  }

  return data;
}

// Get all government data modules
router.get('/data', async (req: Request, res: Response) => {
  try {
    const modules = [
      { name: 'Weather', table: 'gov_weather', icon: 'sun' },
      { name: 'Crop Prices', table: 'gov_crop_prices', icon: 'wheat' },
      { name: 'Infrastructure', table: 'gov_infrastructure_news', icon: 'road' },
      { name: 'Schemes', table: 'gov_schemes', icon: 'file-text' },
      { name: 'JJM (Water)', table: 'gov_jjm', icon: 'droplets' },
      { name: 'PMAY Housing', table: 'gov_pmay', icon: 'home' },
      { name: 'Courts', table: 'gov_courts', icon: 'scale' },
      { name: 'Schools (UDISE+)', table: 'gov_schools', icon: 'graduation-cap' },
      { name: 'Elections', table: 'gov_elections', icon: 'landmark' },
      { name: 'Crime / Safety', table: 'gov_crimes', icon: 'shield' },
      { name: 'Budget', table: 'gov_budgets', icon: 'banknote' },
      { name: 'Population', table: 'gov_population', icon: 'users' },
    ];

    const result: any = { modules: [], totals: {} };

    for (const mod of modules) {
      try {
        const rows = await fetchTable(mod.table, 50);
        result.modules.push({
          ...mod,
          count: rows.length,
          latest: rows[0] || null,
        });
        result.totals[mod.table] = rows.length;
      } catch (e: any) {
        result.modules.push({ ...mod, count: 0, latest: null, error: e.message });
        result.totals[mod.table] = 0;
      }
    }

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Gov Data] Error fetching all data:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get specific module data by table name
router.get('/data/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const allowed = [
      'gov_weather', 'gov_crop_prices', 'gov_infrastructure_news',
      'gov_schemes', 'gov_jjm', 'gov_pmay', 'gov_courts',
      'gov_schools', 'gov_elections', 'gov_crimes', 'gov_budgets',
      'gov_population',
    ];

    if (!allowed.includes(tableName)) {
      return res.status(400).json({ success: false, error: 'Invalid table name' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const rows = await fetchTable(tableName, limit);
    res.json({ success: true, table: tableName, count: rows.length, data: rows });
  } catch (err: any) {
    console.error(`[Gov Data] Error fetching ${req.params.tableName}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get dashboard data for a specific location
router.get('/dashboard/:locationName', async (req: Request, res: Response) => {
  try {
    const { locationName } = req.params;

    // Find district(s) matching the name
    const { data: districts } = await supabase
      .from('gov_districts')
      .select('id, name, state_id, gov_states(name)')
      .ilike('name', `%${locationName}%`)
      .limit(1);

    const district = districts && districts.length > 0 ? districts[0] : null;
    const districtId = district?.id;
    const districtNameResolved = district?.name || locationName;
    const stateNameResolved = district?.gov_states?.name || 'Unknown State';

    const modules = [
      { id: 'weather', table: 'gov_weather', titleField: 'station_name' },
      { id: 'crop_prices', table: 'gov_crop_prices', titleField: 'market_name' },
      { id: 'infrastructure', table: 'gov_infrastructure_news', titleField: 'title' },
      { id: 'schemes', table: 'gov_schemes', titleField: 'scheme_name' },
      { id: 'jjm', table: 'gov_jjm', titleField: 'habitation_name' },
      { id: 'pmay', table: 'gov_pmay', titleField: 'houses_completed' },
      { id: 'courts', table: 'gov_courts', titleField: 'case_type' },
      { id: 'schools', table: 'gov_schools', titleField: 'school_name' },
      { id: 'elections', table: 'gov_elections', titleField: 'constituency_name' },
      { id: 'crimes', table: 'gov_crimes', titleField: 'year' },
      { id: 'budgets', table: 'gov_budgets', titleField: 'fiscal_year' },
      { id: 'population', table: 'gov_population', titleField: 'census_year' },
    ];

    const results: any = {};
    const overview = [];

    // Map through and fetch where possible
    for (const mod of modules) {
      if (districtId) {
        // Try fetching by district_id
        const { data, error } = await supabase.from(mod.table).select('*').eq('district_id', districtId).limit(50);
        if (!error && data && data.length > 0) {
          results[mod.id] = data;
          overview.push({ id: mod.id, label: mod.id.replace('_', ' ').toUpperCase(), count: data.length });
          continue; // Successfully found by district_id
        }
      }

      // Fallback: Try ILIKE on the identifying text field
      if (mod.titleField && ['station_name', 'market_name', 'habitation_name', 'school_name'].includes(mod.titleField)) {
         const { data, error } = await supabase.from(mod.table).select('*').ilike(mod.titleField, `%${locationName}%`).limit(50);
         if (!error && data && data.length > 0) {
           results[mod.id] = data;
           overview.push({ id: mod.id, label: mod.id.replace('_', ' ').toUpperCase(), count: data.length });
           continue;
         }
      }

      // Check scheme table as a global
      if (mod.id === 'schemes') {
         const { data } = await supabase.from('gov_schemes').select('*').limit(20);
         results.schemes = data || [];
         overview.push({ id: 'schemes', label: 'SCHEMES', count: results.schemes.length });
         continue;
      }

      results[mod.id] = [];
      overview.push({ id: mod.id, label: mod.id.replace('_', ' ').toUpperCase(), count: 0 });
    }

    res.json({
      success: true,
      location: {
        searched: locationName,
        district: districtNameResolved,
        state: stateNameResolved,
        district_id: districtId
      },
      overview,
      data: results
    });

  } catch (err: any) {
    console.error(`[Gov Data Dashboard] Error:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get state-level aggregate analytics
router.get('/state-analytics', async (req: Request, res: Response) => {
  try {
    const { data: states } = await supabase.from('gov_states').select('id, name');
    const stateMap = new Map((states || []).map((s: any) => [s.id, { id: s.id, name: s.name, total: 0, modules: {} }]));

    const modules = [
      { id: 'weather', table: 'gov_weather' },
      { id: 'crop_prices', table: 'gov_crop_prices' },
      { id: 'infrastructure', table: 'gov_infrastructure_news' },
      { id: 'jjm', table: 'gov_jjm' },
      { id: 'pmay', table: 'gov_pmay' },
      { id: 'courts', table: 'gov_courts' },
      { id: 'schools', table: 'gov_schools' },
      { id: 'elections', table: 'gov_elections' },
      { id: 'crimes', table: 'gov_crimes' },
      { id: 'budgets', table: 'gov_budgets' },
      { id: 'population', table: 'gov_population' },
    ];

    // Initialize module counts for all states
    for (const state of stateMap.values()) {
      modules.forEach(m => state.modules[m.id] = 0);
    }

    // Fetch all data and aggregate by state_id
    for (const mod of modules) {
      const { data } = await supabase.from(mod.table).select('state_id');
      if (data) {
        data.forEach((row: any) => {
          if (row.state_id && stateMap.has(row.state_id)) {
            const st = stateMap.get(row.state_id)!;
            st.modules[mod.id] = (st.modules[mod.id] || 0) + 1;
            st.total += 1;
          }
        });
      }
    }

    // Convert map to sorted array
    const sortedStates = Array.from(stateMap.values()).sort((a, b) => b.total - a.total);

    res.json({ success: true, data: sortedStates });
  } catch (err: any) {
    console.error(`[Gov State Analytics] Error:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get location suggestions for autocomplete
router.get('/locations', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Search in districts table for matching names
    const { data } = await supabase
      .from('gov_districts')
      .select('name, state_id, gov_states(name)')
      .ilike('name', `%${q}%`)
      .limit(10);

    // Format suggestions
    const suggestions = data.map((district: any) => ({
      label: `${district.name}, ${district.gov_states?.name || 'Unknown State'}`,
      value: district.name
    }));

    res.json({ success: true, data: suggestions });
  } catch (err: any) {
    console.error(`[Gov Locations] Error:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Keep existing scrape endpoint
router.post('/scrape', (req: Request, res: Response) => {
  const { moduleId } = req.body;
  let command = 'node ../Zonek_gov/src/pipeline.js --force';
  if (moduleId && moduleId !== 'all') {
    command += ` --module ${moduleId}`;
  }
  const backendRoot = process.cwd();
  const rootDir = require('path').resolve(backendRoot, '../');
  const { exec } = require('child_process');
  console.log(`[Gov Scraper] Executing: ${command}`);
  exec(command, { cwd: rootDir }, (error: any, stdout: string, stderr: string) => {
    if (error) {
      console.error(`[Gov Scraper] Error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message, stderr });
    }
    console.log(`[Gov Scraper] Output: ${stdout}`);
    if (stderr) console.error(`[Gov Scraper] Stderr: ${stderr}`);
    return res.json({ success: true, output: stdout, stderr });
  });
});

export default router;
