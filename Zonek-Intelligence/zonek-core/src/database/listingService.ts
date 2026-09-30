import { IListing, getListingModel, getAdsModel, ScrapingStatus } from './schema.js';
import { RawListing } from '../engine/extractor.js';

export class ListingService {
  static async upsertRawListing(
    cityName: string,
    source: 'justdial' | 'sulekha',
    category: string,
    locality: string,
    raw: RawListing
  ): Promise<IListing | null> {
    try {
      const ListingModel = getListingModel(cityName);
      const updateData = {
        name: raw.title,
        url: raw.link,
        phone: raw.phone ? [raw.phone] : [],
        address: raw.address || '',
        locality: locality,
        category: category,
        externalId: raw._id,
        source: source,
        _index: raw._index,
        _qualityScore: raw._qualityScore,
        status: 'active',
        lastScrapedAt: new Date()
      };

      // Perform Upsert using raw._id as externalId for consistency with Extension
      const listing = await ListingModel.findOneAndUpdate(
        { externalId: raw._id, source },
        { $set: updateData },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );

      return listing;
    } catch (error) {
      console.error(`❌ Upsert Error for ${raw._id} in ${cityName}:`, error);
      return null;
    }
  }

  /**
   * Marks listings that were NOT found in the latest scrape as 'inactive'.
   */
  static async softDeleteMissing(
    cityName: string,
    source: 'justdial' | 'sulekha',
    locality: string,
    category: string,
    seenExternalIds: string[]
  ) {
    try {
      const ListingModel = getListingModel(cityName);
      const result = await ListingModel.updateMany(
        {
          source,
          locality,
          category,
          externalId: { $nin: seenExternalIds },
          status: 'active'
        },
        {
          $set: {
            status: 'inactive',
            deletedAt: new Date()
          }
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`🧹 Soft deleted ${result.modifiedCount} missing listings in ${cityName} (${locality}) - ${category}`);
      }
    } catch (error) {
      console.error(`❌ Soft Delete Error for ${cityName}:`, error);
    }
  }

  /**
   * Generic Ads: High-Concurrency Duplicate Exclusion Strategy.
   * Gets unenriched listings for any city.
   */
  static async getUnenrichedListingsByCategory(
    cityName: string,
    source: 'justdial' | 'sulekha',
    category: string,
    limit: number = 500
  ): Promise<IListing[]> {
    try {
      const ListingModel = getListingModel(cityName);
      const AdsModel = getAdsModel(cityName);

      // Find all IDs we've already successfully parsed in specific city Ads
      const existingAdsIds = await AdsModel.distinct('externalId', { source, category });

      // Pull from Stage 1 strictly avoiding anything we've already parsed!
      return await ListingModel.find({
        source,
        category,
        externalId: { $nin: existingAdsIds },
        status: 'active',
        url: { $exists: true, $ne: '' }
      }).limit(limit);
    } catch (error) {
      console.error(`❌ Error fetching unenriched listings for ${cityName} - ${category}:`, error);
      return [];
    }
  }

  static async saveToEnrichedAds(
    cityName: string,
    sourceListing: IListing,
    details: { 
      images: string[], 
      workingHours: string | null, 
      rating: number | null, 
      reviewCount: number | null,
      ratingCount?: number | null,
      phone?: string[],
      overview?: string | null,
      yearEstablished?: string | null,
      services?: string[],
      quickInfo?: { [key: string]: string[] } | string[],
      priceList?: { name: string; price: string }[],
      reviewsList?: { author: string; rating: number; text: string; date: string }[]
    }
  ): Promise<void> {
    try {
      const AdsModel = getAdsModel(cityName);

      // Determine final phone list: Prefer enriched phone if found
      const finalPhones = (details.phone && details.phone.length > 0) 
        ? details.phone 
        : (sourceListing.phone || []);

      // Construct the Ads entry merging the Stage 1 data with the newly enriched data
      const adsEntry = {
        externalId: sourceListing.externalId,
        source: sourceListing.source,
        name: sourceListing.name,
        url: sourceListing.url,
        phone: finalPhones,
        email: sourceListing.email || '',
        website: sourceListing.website || '',
        address: sourceListing.address,
        locality: sourceListing.locality,
        pincode: sourceListing.pincode,
        location: sourceListing.location,
        category: sourceListing.category,
        status: sourceListing.status,
        verified: sourceListing.verified,
        _index: (sourceListing as any)._index || 0,
        _qualityScore: (sourceListing as any)._qualityScore || 0,
        metadata: sourceListing.metadata,
        
        // The newly fetched enriched data
        images: details.images,
        workingHours: details.workingHours || '',
        rating: details.rating || 0,
        reviewCount: details.reviewCount || 0,
        ratingCount: details.ratingCount || 0,
        yearEstablished: details.yearEstablished || '',
        
        // Deep profile extraction
        overview: details.overview || '',
        services: details.services || [],
        quickInfo: details.quickInfo || [],
        priceList: details.priceList || [],
        reviewsList: details.reviewsList || [],
        
        lastScrapedAt: new Date()
      };

      await AdsModel.findOneAndUpdate(
        { externalId: adsEntry.externalId, source: adsEntry.source },
        { $set: adsEntry },
        { upsert: true, runValidators: true }
      );
    } catch (error) {
      console.error(`❌ Error saving to ${cityName}_ads collection for ID ${sourceListing.externalId}:`, error);
    }
  }

  static async incrementalSync(
    cityName: string,
    items: RawListing[],
    source: 'justdial' | 'sulekha',
    area: string,
    category: string
  ): Promise<void> {
    if (items.length > 0) {
      console.log(`💾 Incremental Sync: Saving ${items.length} new items to ${cityName}_List...`);
      for (const item of items) {
        await this.upsertRawListing(cityName, source, category, area, item);
      }
    }
  }

  static async setScrapingStatus(
    cityName: string,
    type: 'list' | 'ads',
    status: 'pending' | 'in_progress' | 'completed',
    category?: string
  ): Promise<void> {
    try {
      await ScrapingStatus.findOneAndUpdate(
        { cityName, type, category },
        { status, lastScrapedAt: new Date() },
        { upsert: true }
      );
    } catch (error) {
      console.error(`❌ Error updating scraping status for ${cityName}:`, error);
    }
  }

  static async getScrapingStatus(
    cityName: string,
    type: 'list' | 'ads',
    category?: string
  ): Promise<string> {
    try {
      const record = await ScrapingStatus.findOne({ cityName, type, category });
      return record ? record.status : 'pending';
    } catch (error) {
      console.error(`❌ Error fetching scraping status for ${cityName}:`, error);
      return 'pending';
    }
  }

  static async countExistingListings(cityName: string, category: string): Promise<number> {
    try {
      const ListingModel = getListingModel(cityName);
      return await ListingModel.countDocuments({ category });
    } catch (error) {
      return 0;
    }
  }
}
