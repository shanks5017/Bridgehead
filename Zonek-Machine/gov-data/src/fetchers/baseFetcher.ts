import { supabase } from '../config/db';
import { resolveGeoIds } from '../utils/geoResolver';
import { objectKeysToSnakeCase } from '../utils/objectUtils';
import logger from '../utils/logger';

export abstract class BaseFetcher {
  public abstract getId(): string;
  public abstract getTableName(): string;
  public abstract getConflictTarget(): string[];
  public abstract fetchData(): Promise<any[]>;
  public abstract transformRecord(rawRecord: any): any;

  public hasStateId(): boolean { return true; }
  public hasDistrictId(): boolean { return true; }

  public async run(): Promise<{ status: string; saved?: number; error?: string }> {
    const start = Date.now();
    const fetcherId = this.getId();
    logger.info(`[${fetcherId}] ▶  Starting fetch...`);

    const needsGeo = this.hasStateId() || this.hasDistrictId();

    try {
      const rawRecords = await this.fetchData();
      if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
        logger.warn(`[${fetcherId}] ⚠️  No records returned from source`);
        return { status: 'success', saved: 0 };
      }

      logger.info(`[${fetcherId}] 🔄  Transforming ${rawRecords.length} records...`);

      const recordsToSave: any[] = [];
      for (const raw of rawRecords) {
        try {
          const transformed = this.transformRecord(raw);
          const record = { ...transformed };

          if (needsGeo) {
            if (!transformed.stateName && this.hasStateId()) {
              logger.warn(`[${fetcherId}] Skipping record missing stateName:`, transformed);
              continue;
            }
            if (transformed.stateName) {
              const { stateId, districtId } = await resolveGeoIds(
                transformed.stateName,
                transformed.districtName || null
              );

              if (this.hasStateId() && stateId) record.state_id = stateId;
              if (this.hasDistrictId() && districtId !== undefined) record.district_id = districtId;
            }

            delete record.stateName;
            delete record.districtName;
          }

          const finalRecord = objectKeysToSnakeCase(record);
          recordsToSave.push(finalRecord);
        } catch (transformError: any) {
          logger.error(`[${fetcherId}] ❌ Transform error: ${transformError.message}`);
        }
      }

      if (recordsToSave.length === 0) {
        logger.warn(`[${fetcherId}] ⚠️  No valid records after transformation`);
        return { status: 'success', saved: 0 };
      }

      const tableName = this.getTableName();
      const conflictTarget = this.getConflictTarget();
      logger.info(`[${fetcherId}] 💾  Upserting ${recordsToSave.length} records to ${tableName}...`);

      const { error } = await supabase
        .from(tableName)
        .upsert(recordsToSave, { onConflict: conflictTarget.join(',') });

      if (error) {
        throw new Error(`Supabase upsert failed: ${error.message}`);
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      logger.info(`[${fetcherId}] ✅ Done — saved ${recordsToSave.length} records (${elapsed}s)`);
      return { status: 'success', saved: recordsToSave.length };
    } catch (err: any) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      logger.error(`[${fetcherId}] ❌ FAILED after ${elapsed}s: ${err.message}`);
      return { status: 'failed', error: err.message };
    }
  }
}

export default BaseFetcher;
