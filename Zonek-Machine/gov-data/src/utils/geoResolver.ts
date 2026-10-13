import { supabase } from '../config/db';
import logger from './logger';

export async function resolveGeoIds(stateName: string, districtName: string | null = null): Promise<{ stateId?: string; districtId?: string }> {
  let stateId: string | undefined;
  let districtId: string | undefined;

  try {
    const { data: stateData, error: stateError } = await supabase
      .from('gov_states')
      .select('id')
      .ilike('name', stateName.trim())
      .single();

    if (stateError && stateError.code !== 'PGRST116') {
      logger.error(`Failed to resolve state: ${stateName} - ${stateError.message}`);
    }
    if (stateData) {
      stateId = stateData.id;
    } else {
      const { data: newState, error: insertError } = await supabase
        .from('gov_states')
        .insert([{ name: stateName.trim() }])
        .select('id')
        .single();
      if (!insertError && newState) {
        stateId = newState.id;
      }
    }

    if (stateId && districtName) {
      const { data: distData, error: distError } = await supabase
        .from('gov_districts')
        .select('id')
        .eq('state_id', stateId)
        .ilike('name', districtName.trim())
        .single();

      if (distError && distError.code !== 'PGRST116') {
        logger.error(`Failed to resolve district: ${districtName} - ${distError.message}`);
      }
      if (distData) {
        districtId = distData.id;
      } else {
        const { data: newDist, error: insertDistError } = await supabase
          .from('gov_districts')
          .insert([{ state_id: stateId, name: districtName.trim() }])
          .select('id')
          .single();
        if (!insertDistError && newDist) {
          districtId = newDist.id;
        }
      }
    }

  } catch (err: any) {
    logger.error(`GeoResolver exception: ${err.message}`);
  }

  return { 
    ...(stateId ? { stateId } : {}), 
    ...(districtId ? { districtId } : {})
  };
}
