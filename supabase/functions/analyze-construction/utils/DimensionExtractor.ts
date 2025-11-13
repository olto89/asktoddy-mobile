/**
 * Dimension Extractor - Extract project dimensions from text
 * Simple, reliable patterns for common dimension formats
 */

export interface ExtractedDimensions {
  length: number;
  width: number;
  height?: number;
  confidence: number;
  source: string;
}

export class DimensionExtractor {
  /**
   * Extract dimensions from text using common patterns
   */
  static extractDimensions(text: string): ExtractedDimensions | null {
    const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');

    // Define patterns in order of confidence
    const patterns = [
      {
        name: 'meters_with_x',
        regex: /(\d+(?:\.\d+)?)\s*m\s*[×x]\s*(\d+(?:\.\d+)?)\s*m/g,
        confidence: 0.95,
      },
      {
        name: 'dimensions_with_meter',
        regex: /(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*meter/g,
        confidence: 0.9,
      },
      {
        name: 'meter_by_meter',
        regex: /(\d+(?:\.\d+)?)\s*meter\s*by\s*(\d+(?:\.\d+)?)\s*meter/g,
        confidence: 0.9,
      },
      {
        name: 'simple_x_format',
        regex: /(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)/g,
        confidence: 0.7,
      },
      {
        name: 'by_format',
        regex: /(\d+(?:\.\d+)?)\s*by\s*(\d+(?:\.\d+)?)/g,
        confidence: 0.6,
      },
    ];

    // Try each pattern
    for (const pattern of patterns) {
      const matches = [...normalizedText.matchAll(pattern.regex)];

      for (const match of matches) {
        const length = parseFloat(match[1]);
        const width = parseFloat(match[2]);

        // Validate dimensions are reasonable for construction
        if (this.isValidDimension(length) && this.isValidDimension(width)) {
          return {
            length,
            width,
            confidence: pattern.confidence,
            source: `Extracted from: "${match[0]}" using pattern: ${pattern.name}`,
          };
        }
      }
    }

    // Try square footage patterns as fallback
    const sqmPattern = /(\d+(?:\.\d+)?)\s*(?:square\s*)?(?:m²|sqm|sq\.?\s*m)/g;
    const sqmMatch = sqmPattern.exec(normalizedText);

    if (sqmMatch) {
      const area = parseFloat(sqmMatch[1]);
      if (area >= 4 && area <= 500) {
        // Reasonable area range
        // Assume square for simplicity
        const side = Math.sqrt(area);
        return {
          length: Math.round(side * 10) / 10,
          width: Math.round(side * 10) / 10,
          confidence: 0.5,
          source: `Calculated from ${area}m² area (assumed square)`,
        };
      }
    }

    return null;
  }

  /**
   * Check if dimension is valid for construction projects
   */
  private static isValidDimension(dim: number): boolean {
    return dim >= 1 && dim <= 50; // 1m to 50m is reasonable range
  }

  /**
   * Extract quality level from text
   */
  static extractQualityLevel(text: string): 'budget' | 'standard' | 'premium' {
    const normalizedText = text.toLowerCase();

    const budgetKeywords = ['budget', 'cheap', 'basic', 'low cost', 'economy'];
    const premiumKeywords = ['luxury', 'high end', 'premium', 'top quality', 'expensive'];

    for (const keyword of premiumKeywords) {
      if (normalizedText.includes(keyword)) {
        return 'premium';
      }
    }

    for (const keyword of budgetKeywords) {
      if (normalizedText.includes(keyword)) {
        return 'budget';
      }
    }

    return 'standard'; // Default
  }

  /**
   * Extract project features from text
   */
  static extractFeatures(text: string): {
    hasElectrical: boolean;
    hasPlumbing: boolean;
    hasBathroom: boolean;
    hasKitchen: boolean;
    socketCount?: number;
  } {
    const normalizedText = text.toLowerCase();

    // Socket count extraction
    let socketCount: number | undefined;
    const socketMatch = normalizedText.match(/(\d+)\s*(?:socket|outlet)/);
    if (socketMatch) {
      socketCount = parseInt(socketMatch[1]);
    }

    return {
      hasElectrical: /electrical|electric|socket|light|power|wiring/.test(normalizedText),
      hasPlumbing: /plumb|water|pipe|bathroom|toilet|sink|tap/.test(normalizedText),
      hasBathroom: /bathroom|toilet|shower|bath|ensuite/.test(normalizedText),
      hasKitchen: /kitchen|cook|dining/.test(normalizedText),
      socketCount,
    };
  }
}
