/**
 * Bridgehead Extraction Engine
 * Core logic for intelligent DOM analysis and data extraction.
 */

export interface ExtractionSchema {
  containerSelector: string;
  fields: {
    [key: string]: {
      selector: string;
      attribute?: string;
      type: 'text' | 'url' | 'email' | 'phone' | 'number' | 'date';
      required: boolean;
    };
  };
}

export interface ExtractedItem {
  id: string;
  data: Record<string, any>;
  timestamp: string;
  sourceUrl: string;
}

export class ExtractionEngine {
  /**
   * Analyzes a DOM element and extracts data based on a schema.
   */
  static extractFromElement(element: Element, schema: ExtractionSchema): Record<string, any> {
    const data: Record<string, any> = {};

    for (const [fieldName, config] of Object.entries(schema.fields)) {
      const fieldElement = element.querySelector(config.selector);
      if (!fieldElement) {
        if (config.required) return null; // Skip if required field is missing
        data[fieldName] = null;
        continue;
      }

      let value: any = null;
      if (config.attribute) {
        value = fieldElement.getAttribute(config.attribute);
      } else {
        value = fieldElement.textContent?.trim();
      }

      // Basic Normalization
      data[fieldName] = this.normalizeValue(value, config.type);
    }

    return data;
  }

  /**
   * Normalizes values based on their detected or specified type.
   */
  private static normalizeValue(value: any, type: string): any {
    if (!value) return null;

    switch (type) {
      case 'number':
        const num = parseFloat(value.replace(/[^0-9.-]+/g, ""));
        return isNaN(num) ? null : num;
      case 'email':
        return value.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/)?.[0] || value;
      case 'url':
        try {
          return new URL(value, window.location.origin).href;
        } catch {
          return value;
        }
      case 'phone':
        return value.replace(/[^0-9+]+/g, "");
      default:
        return value;
    }
  }

  /**
   * Intelligent Pattern Recognition
   * Finds repeating elements that likely contain structured data.
   */
  static findRepeatPatterns(root: Element = document.body): string[] {
    const containers = new Map<string, number>();
    const allElements = root.querySelectorAll('*');

    allElements.forEach(el => {
      if (el.children.length < 2) return;
      
      const childTags = Array.from(el.children).map(c => c.tagName).join(',');
      const childClasses = Array.from(el.children).map(c => c.className).join('|');
      const pattern = `${childTags}::${childClasses}`;
      
      containers.set(pattern, (containers.get(pattern) || 0) + 1);
    });

    // Return patterns that appear frequently
    return Array.from(containers.entries())
      .filter(([_, count]) => count > 1)
      .map(([pattern]) => pattern);
  }
}
