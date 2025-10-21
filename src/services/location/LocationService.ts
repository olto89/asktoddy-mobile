/**
 * LocationService - GPS and UK region detection for accurate pricing
 * Provides real-time location data and regional pricing multipliers
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coordinates: Coordinates;
  city?: string;
  region?: string;
  country?: string;
  postcode?: string;
  formatted?: string;
}

export interface UKRegion {
  name: string;
  shortCode: string;
  pricingMultiplier: number;
  description: string;
}

/**
 * UK regional pricing multipliers based on construction costs
 * Source: Based on UK construction industry data
 */
export const UK_REGIONS: Record<string, UKRegion> = {
  LONDON: {
    name: 'London',
    shortCode: 'LON',
    pricingMultiplier: 1.25,
    description: 'Central London and Greater London area'
  },
  SOUTH_EAST: {
    name: 'South East',
    shortCode: 'SE',
    pricingMultiplier: 1.15,
    description: 'Kent, Surrey, Sussex, Hampshire, Berkshire, Buckinghamshire, Oxfordshire'
  },
  SOUTH_WEST: {
    name: 'South West',
    shortCode: 'SW',
    pricingMultiplier: 1.05,
    description: 'Cornwall, Devon, Dorset, Somerset, Bristol, Gloucestershire, Wiltshire'
  },
  EAST_ANGLIA: {
    name: 'East Anglia',
    shortCode: 'EA',
    pricingMultiplier: 1.05,
    description: 'Norfolk, Suffolk, Cambridgeshire, Essex'
  },
  MIDLANDS: {
    name: 'Midlands',
    shortCode: 'MID',
    pricingMultiplier: 1.0,
    description: 'Birmingham, Coventry, Leicester, Nottingham, Derby, Stoke'
  },
  NORTH_WEST: {
    name: 'North West',
    shortCode: 'NW',
    pricingMultiplier: 0.95,
    description: 'Manchester, Liverpool, Lancashire, Cumbria, Cheshire'
  },
  NORTH_EAST: {
    name: 'North East',
    shortCode: 'NE',
    pricingMultiplier: 0.90,
    description: 'Newcastle, Sunderland, Durham, Northumberland'
  },
  YORKSHIRE: {
    name: 'Yorkshire',
    shortCode: 'YKS',
    pricingMultiplier: 0.95,
    description: 'Leeds, Sheffield, Bradford, York, Hull'
  },
  SCOTLAND: {
    name: 'Scotland',
    shortCode: 'SCT',
    pricingMultiplier: 0.90,
    description: 'Edinburgh, Glasgow, Aberdeen, Dundee'
  },
  WALES: {
    name: 'Wales',
    shortCode: 'WAL',
    pricingMultiplier: 0.90,
    description: 'Cardiff, Swansea, Newport, Wrexham'
  },
  NORTHERN_IRELAND: {
    name: 'Northern Ireland',
    shortCode: 'NI',
    pricingMultiplier: 0.85,
    description: 'Belfast, Derry, Lisburn, Newtownabbey'
  }
};

/**
 * Postcode to region mapping for UK
 * Based on postcode areas
 */
const POSTCODE_TO_REGION: Record<string, string> = {
  // London
  'EC': 'LONDON', 'WC': 'LONDON', 'E': 'LONDON', 'W': 'LONDON', 
  'N': 'LONDON', 'S': 'LONDON', 'SE': 'LONDON', 'SW': 'LONDON',
  'NW': 'LONDON', 'BR': 'LONDON', 'CR': 'LONDON', 'DA': 'LONDON',
  'EN': 'LONDON', 'HA': 'LONDON', 'IG': 'LONDON', 'KT': 'LONDON',
  'RM': 'LONDON', 'SM': 'LONDON', 'TW': 'LONDON', 'UB': 'LONDON',
  
  // South East
  'BN': 'SOUTH_EAST', 'CT': 'SOUTH_EAST', 'GU': 'SOUTH_EAST',
  'ME': 'SOUTH_EAST', 'OX': 'SOUTH_EAST', 'PO': 'SOUTH_EAST',
  'RG': 'SOUTH_EAST', 'RH': 'SOUTH_EAST', 'SL': 'SOUTH_EAST',
  'SO': 'SOUTH_EAST', 'TN': 'SOUTH_EAST',
  
  // South West
  'BA': 'SOUTH_WEST', 'BH': 'SOUTH_WEST', 'BS': 'SOUTH_WEST',
  'DT': 'SOUTH_WEST', 'EX': 'SOUTH_WEST', 'GL': 'SOUTH_WEST',
  'PL': 'SOUTH_WEST', 'SN': 'SOUTH_WEST', 'SP': 'SOUTH_WEST',
  'TA': 'SOUTH_WEST', 'TQ': 'SOUTH_WEST', 'TR': 'SOUTH_WEST',
  
  // East Anglia
  'CB': 'EAST_ANGLIA', 'CM': 'EAST_ANGLIA', 'CO': 'EAST_ANGLIA',
  'IP': 'EAST_ANGLIA', 'NR': 'EAST_ANGLIA', 'PE': 'EAST_ANGLIA',
  'SS': 'EAST_ANGLIA',
  
  // Midlands
  'B': 'MIDLANDS', 'CV': 'MIDLANDS', 'DE': 'MIDLANDS',
  'DY': 'MIDLANDS', 'LE': 'MIDLANDS', 'NG': 'MIDLANDS',
  'NN': 'MIDLANDS', 'ST': 'MIDLANDS', 'WR': 'MIDLANDS',
  'WS': 'MIDLANDS', 'WV': 'MIDLANDS',
  
  // North West
  'BB': 'NORTH_WEST', 'BL': 'NORTH_WEST', 'CA': 'NORTH_WEST',
  'CH': 'NORTH_WEST', 'CW': 'NORTH_WEST', 'FY': 'NORTH_WEST',
  'L': 'NORTH_WEST', 'LA': 'NORTH_WEST', 'M': 'NORTH_WEST',
  'OL': 'NORTH_WEST', 'PR': 'NORTH_WEST', 'SK': 'NORTH_WEST',
  'WA': 'NORTH_WEST', 'WN': 'NORTH_WEST',
  
  // North East
  'DH': 'NORTH_EAST', 'DL': 'NORTH_EAST', 'NE': 'NORTH_EAST',
  'SR': 'NORTH_EAST', 'TS': 'NORTH_EAST',
  
  // Yorkshire
  'BD': 'YORKSHIRE', 'DN': 'YORKSHIRE', 'HD': 'YORKSHIRE',
  'HG': 'YORKSHIRE', 'HU': 'YORKSHIRE', 'HX': 'YORKSHIRE',
  'LS': 'YORKSHIRE', 'S': 'YORKSHIRE', 'WF': 'YORKSHIRE',
  'YO': 'YORKSHIRE',
  
  // Scotland
  'AB': 'SCOTLAND', 'DD': 'SCOTLAND', 'DG': 'SCOTLAND',
  'EH': 'SCOTLAND', 'FK': 'SCOTLAND', 'G': 'SCOTLAND',
  'HS': 'SCOTLAND', 'IV': 'SCOTLAND', 'KA': 'SCOTLAND',
  'KW': 'SCOTLAND', 'KY': 'SCOTLAND', 'ML': 'SCOTLAND',
  'PA': 'SCOTLAND', 'PH': 'SCOTLAND', 'TD': 'SCOTLAND',
  'ZE': 'SCOTLAND',
  
  // Wales
  'CF': 'WALES', 'LD': 'WALES', 'LL': 'WALES',
  'NP': 'WALES', 'SA': 'WALES', 'SY': 'WALES',
  
  // Northern Ireland
  'BT': 'NORTHERN_IRELAND'
};

export class LocationService {
  private static instance: LocationService;
  private lastKnownLocation: LocationData | null = null;
  private locationPermission: boolean = false;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.locationPermission = status === 'granted';
      
      if (!this.locationPermission) {
        console.log('⚠️ Location permission denied');
      }
      
      return this.locationPermission;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      // Check permissions first
      if (!this.locationPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.log('📍 Using default location: London');
          return this.getDefaultLocation();
        }
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Reverse geocode for address details
      const [address] = await Location.reverseGeocodeAsync(coordinates);
      
      const locationData: LocationData = {
        coordinates,
        city: address?.city || address?.subregion,
        region: address?.region,
        country: address?.country || 'UK',
        postcode: address?.postalCode,
        formatted: this.formatAddress(address),
      };

      this.lastKnownLocation = locationData;
      console.log('📍 Location obtained:', locationData.formatted);
      
      return locationData;
    } catch (error) {
      console.error('Location error:', error);
      return this.getDefaultLocation();
    }
  }

  /**
   * Get UK region from location
   */
  getUKRegion(location: LocationData): UKRegion {
    // Try postcode first
    if (location.postcode) {
      const postcodePrefix = location.postcode.split(' ')[0].replace(/[0-9]/g, '');
      const regionKey = POSTCODE_TO_REGION[postcodePrefix];
      if (regionKey) {
        return UK_REGIONS[regionKey];
      }
    }

    // Fall back to city matching
    if (location.city) {
      const cityLower = location.city.toLowerCase();
      
      // Check for major cities
      if (cityLower.includes('london')) return UK_REGIONS.LONDON;
      if (cityLower.includes('manchester') || cityLower.includes('liverpool')) return UK_REGIONS.NORTH_WEST;
      if (cityLower.includes('birmingham') || cityLower.includes('coventry')) return UK_REGIONS.MIDLANDS;
      if (cityLower.includes('leeds') || cityLower.includes('sheffield')) return UK_REGIONS.YORKSHIRE;
      if (cityLower.includes('edinburgh') || cityLower.includes('glasgow')) return UK_REGIONS.SCOTLAND;
      if (cityLower.includes('cardiff') || cityLower.includes('swansea')) return UK_REGIONS.WALES;
      if (cityLower.includes('belfast')) return UK_REGIONS.NORTHERN_IRELAND;
      if (cityLower.includes('bristol') || cityLower.includes('bath')) return UK_REGIONS.SOUTH_WEST;
      if (cityLower.includes('brighton') || cityLower.includes('oxford')) return UK_REGIONS.SOUTH_EAST;
      if (cityLower.includes('cambridge') || cityLower.includes('norwich')) return UK_REGIONS.EAST_ANGLIA;
      if (cityLower.includes('newcastle') || cityLower.includes('sunderland')) return UK_REGIONS.NORTH_EAST;
    }

    // Default to Midlands (baseline pricing)
    return UK_REGIONS.MIDLANDS;
  }

  /**
   * Get pricing context for current location
   */
  async getPricingContext() {
    const location = await this.getCurrentLocation();
    const region = this.getUKRegion(location!);

    return {
      location: location?.formatted || 'Unknown location',
      city: location?.city || 'Unknown city',
      postcode: location?.postcode,
      region: region.name,
      regionCode: region.shortCode,
      pricingMultiplier: region.pricingMultiplier,
      coordinates: location?.coordinates,
    };
  }

  /**
   * Format address for display
   */
  private formatAddress(address: any): string {
    const parts = [];
    
    if (address?.street) parts.push(address.street);
    if (address?.city) parts.push(address.city);
    if (address?.region) parts.push(address.region);
    if (address?.postalCode) parts.push(address.postalCode);
    if (address?.country) parts.push(address.country);
    
    return parts.filter(Boolean).join(', ') || 'Unknown location';
  }

  /**
   * Get default location (London)
   */
  private getDefaultLocation(): LocationData {
    return {
      coordinates: {
        latitude: 51.5074,
        longitude: -0.1278,
      },
      city: 'London',
      region: 'Greater London',
      country: 'UK',
      postcode: 'SW1A 1AA',
      formatted: 'London, UK',
    };
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * Calculate distance between two points (km)
   */
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }
}