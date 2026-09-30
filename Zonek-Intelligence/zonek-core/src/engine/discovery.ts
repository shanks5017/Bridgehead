export interface AtomicUnit {
  area: string;
  categories: string[];
}

export interface DiscoveryConfig {
  city: string;
  atomicUnits: AtomicUnit[];
}

export class Discovery {
  private config: DiscoveryConfig;

  constructor(config: DiscoveryConfig) {
    this.config = config;
  }

  generateUrls(source: 'justdial' | 'sulekha'): { url: string, area: string, category: string }[] {
    const urls: { url: string, area: string, category: string }[] = [];

    for (const unit of this.config.atomicUnits) {
      for (const category of unit.categories) {
        let url = '';
        if (source === 'justdial') {
          // Justdial URL pattern: https://www.justdial.com/{City}/{Category}-in-{Area}
          const citySlug = this.config.city.toLowerCase();
          const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
          const areaSlug = unit.area.toLowerCase().replace(/\s+/g, '-');
          url = `https://www.justdial.com/${citySlug}/${categorySlug}-in-${areaSlug}`;
        } else {
          // Sulekha URL pattern fallback
          url = `https://www.sulekha.com/${category.toLowerCase().replace(/\s+/g, '-')}-in-${unit.area.toLowerCase().replace(/\s+/g, '-')}`;
        }
        urls.push({ url, area: unit.area, category });
      }
    }

    return urls;
  }

  getAtomicUnits() {
    return this.config.atomicUnits;
  }
}
