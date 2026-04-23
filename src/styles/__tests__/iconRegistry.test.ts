import { AppIcons, IconSize } from '../iconRegistry';

describe('iconRegistry', () => {
  describe('IconSize', () => {
    it('defines all size presets', () => {
      expect(IconSize.inline).toBe(16);
      expect(IconSize.small).toBe(20);
      expect(IconSize.medium).toBe(24);
      expect(IconSize.large).toBe(32);
      expect(IconSize.xlarge).toBe(48);
    });

    it('has ascending size values', () => {
      expect(IconSize.inline).toBeLessThan(IconSize.small);
      expect(IconSize.small).toBeLessThan(IconSize.medium);
      expect(IconSize.medium).toBeLessThan(IconSize.large);
      expect(IconSize.large).toBeLessThan(IconSize.xlarge);
    });
  });

  describe('AppIcons', () => {
    it('has a brand icon', () => {
      expect(AppIcons.brand).toBe('construct-outline');
    });

    it('has all site assessment section icons', () => {
      expect(AppIcons.siteAssessment).toBeDefined();
      expect(AppIcons.propertyAddress).toBeDefined();
      expect(AppIcons.jobType).toBeDefined();
      expect(AppIcons.constructionMethod).toBeDefined();
      expect(AppIcons.quickDetails).toBeDefined();
      expect(AppIcons.whatNeedsDoing).toBeDefined();
      expect(AppIcons.additionalNotes).toBeDefined();
      expect(AppIcons.sitePhotos).toBeDefined();
    });

    it('has all results/quote section icons', () => {
      expect(AppIcons.costEstimate).toBeDefined();
      expect(AppIcons.timeline).toBeDefined();
      expect(AppIcons.toolsRequired).toBeDefined();
      expect(AppIcons.recommendations).toBeDefined();
      expect(AppIcons.professionalRequired).toBeDefined();
    });

    it('has all processing step icons', () => {
      expect(AppIcons.analyzing).toBeDefined();
      expect(AppIcons.extractingTasks).toBeDefined();
      expect(AppIcons.calculatingCosts).toBeDefined();
      expect(AppIcons.buildingQuote).toBeDefined();
    });

    it('has all camera icons', () => {
      expect(AppIcons.cameraAccess).toBeDefined();
      expect(AppIcons.gallery).toBeDefined();
      expect(AppIcons.flipCamera).toBeDefined();
      expect(AppIcons.tip).toBeDefined();
    });

    it('has all confidence guide icons', () => {
      expect(AppIcons.confidenceExcellent).toBeDefined();
      expect(AppIcons.confidenceGood).toBeDefined();
      expect(AppIcons.confidenceImprove).toBeDefined();
    });

    it('uses outline variants for consistency', () => {
      const outlineIcons = Object.entries(AppIcons).filter(
        ([key]) =>
          ![
            'analyzing',
            'quoteGenerated',
            'freeIncludes',
            'premiumFeature',
            'verificationSuccess',
          ].includes(key)
      );
      for (const [key, value] of outlineIcons) {
        expect(value).toMatch(/outline|hourglass|cloud/);
      }
    });

    it('has no emoji characters in any value', () => {
      const emojiRegex =
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}]/u;
      for (const [, value] of Object.entries(AppIcons)) {
        expect(value).not.toMatch(emojiRegex);
      }
    });
  });
});
