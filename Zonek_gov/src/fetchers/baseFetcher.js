'use strict';
const { supabase } = require('../config/db');
const { fetchWithRetry } = require('../utils/httpClient');
const { resolveGeoIds } = require('../utils/geoResolver');
const { objectKeysToSnakeCase } = require('../utils/objectUtils');
const logger = require('../utils/logger');

/**
 * Base class for government data fetchers.
 * Subclasses must implement:
 *   - fetchData(): returns array of raw records from the source API
 *   - transformRecord(rawRecord): returns object ready for storage (must include any needed geo fields)
 *   - getTableName(): returns the Supabase table name (string)
 *   - getConflictTarget(): returns array of column names for upsert onConflict (e.g., ['stationId','observedAt'])
 * Optional:
 *   - getId(): unique identifier for logging (defaults to class name)
 */
class BaseFetcher {
  constructor() {
    if (new.target === BaseFetcher) {
      throw new Error('BaseFetcher cannot be instantiated directly');
    }
  }

  hasStateId() { return true; }
  hasDistrictId() { return true; }

  async run() {
    const start = Date.now();
    const fetcherId = this.getId ? this.getId() : this.constructor.name;
    logger.info(`[${fetcherId}] ▶  Starting fetch...`);

    const needsGeo = this.hasStateId() || this.hasDistrictId();

    try {
      // 1. Fetch raw data
      const rawRecords = await this.fetchData();
      if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
        logger.warn(`[${fetcherId}] ⚠️  No records returned from source`);
        return { status: 'success', saved: 0 };
      }

      logger.info(`[${fetcherId}] 🔄  Transforming ${rawRecords.length} records...`);

      // 2. Transform and validate each record
      const recordsToSave = [];
      for (const raw of rawRecords) {
        try {
          const transformed = this.transformRecord(raw);
          const record = { ...transformed };

          // Resolve geo IDs if needed
          if (needsGeo) {
            if (!transformed.stateName) {
              logger.warn(`[${fetcherId}] Skipping record missing stateName:`, transformed);
              continue;
            }
            const { stateId, districtId } = await resolveGeoIds(
              transformed.stateName,
              transformed.districtName || null
            );

            if (this.hasStateId()) record.state_id = stateId;
            if (this.hasDistrictId() && districtId !== undefined) record.district_id = districtId;

            delete record.stateName;
            delete record.districtName;
          }

          // Ensure columns map accurately to Postgres table
          const finalRecord = objectKeysToSnakeCase(record);
          recordsToSave.push(finalRecord);
        } catch (transformError) {
          logger.error(`[${fetcherId}] ❌ Transform error: ${transformError.message}`);
          // Continue processing other records
        }
      }

      if (recordsToSave.length === 0) {
        logger.warn(`[${fetcherId}] ⚠️  No valid records after transformation`);
        return { status: 'success', saved: 0 };
      }

      // 3. Upsert to Supabase
      const tableName = this.getTableName();
      const conflictTarget = this.getConflictTarget();
      logger.info(`[${fetcherId}] 💾  Upserting ${recordsToSave.length} records to ${tableName}...`);

      const { error } = await supabase
        .from(tableName)
        .upsert(recordsToSave, { onConflict: conflictTarget });

      if (error) {
        throw new Error(`Supabase upsert failed: ${error.message}`);
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      logger.info(`[${fetcherId}] ✅ Done — saved ${recordsToSave.length} records (${elapsed}s)`);
      return { status: 'success', saved: recordsToSave.length };
    } catch (err) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      logger.error(`[${fetcherId}] ❌ FAILED after ${elapsed}s: ${err.message}`);
      return { status: 'failed', error: err.message };
    }
  }
}

module.exports = BaseFetcher;