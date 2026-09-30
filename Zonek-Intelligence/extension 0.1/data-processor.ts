/**
 * Bridgehead Extension - Data Normalization & Quality Processor
 */

export class DataProcessor {
  /**
   * Normalizes a single item based on its field types.
   */
  static normalizeItem(item: any): any {
    const normalized = { ...item };
    
    if (normalized.title) {
      normalized.title = this.cleanText(normalized.title);
    }
    
    // Ensure title is never empty for UI visibility
    if (!normalized.title || normalized.title.trim() === "") {
      normalized.title = `Listing Item #${normalized._index || '?'}`;
    }

    if (normalized.price) normalized.price = this.normalizePrice(normalized.price);
    if (normalized.phone) normalized.phone = this.normalizePhone(normalized.phone);
    if (normalized.email) normalized.email = normalized.email.toLowerCase().trim();
    if (normalized.link) normalized.link = this.normalizeUrl(normalized.link);

    normalized._qualityScore = this.calculateQualityScore(normalized);
    return normalized;
  }

  static cleanText(text: string): string {
    return text
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/\s\s+/g, ' ')
      .trim();
  }

  static normalizePrice(price: string): string {
    // Extract numeric value and currency
    const numericContent = price.replace(/[^\d.,]/g, '');
    const currency = price.includes('₹') ? 'INR' : price.includes('$') ? 'USD' : 'Unknown';
    return `${currency} ${numericContent}`.trim();
  }

  static normalizePhone(phone: string): string {
    // Simple E.164-ish normalization (removes non-digits except +)
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`; // Default to IN if 10 digits
    return cleaned;
  }

  static normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.href;
    } catch {
      return url;
    }
  }

  /**
   * PDA Formula: (Completeness × 0.3) + (Accuracy × 0.4) + (Validity × 0.3)
   * Simplified for client-side: (Completeness × 0.5) + (Validity × 0.5)
   */
  static calculateQualityScore(item: any): number {
    const fields = Object.keys(item).filter(k => !k.startsWith('_'));
    if (fields.length === 0) return 0;

    const filledFields = fields.filter(f => !!item[f]);
    const completeness = (filledFields.length / fields.length) * 100;
    
    // Simple validity check (regex matches)
    let validCount = 0;
    const checkableFields = Math.min(fields.length, 4);
    
    if (item.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) validCount++;
    if (item.phone && /^\+?[\d\s-]{10,}$/.test(item.phone)) validCount++;
    if (item.link && item.link.startsWith('http')) validCount++;
    if (item.title && item.title.length > 3) validCount++;

    const validity = checkableFields > 0 ? (validCount / checkableFields) * 100 : 0;

    const score = Math.round((completeness * 0.5) + (validity * 0.5));
    return isNaN(score) ? 0 : score;
  }
}
