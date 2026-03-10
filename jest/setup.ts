/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── expo-constants ──────────────────────────────────────────────
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
    manifest: null,
  },
}));

// ─── AsyncStorage (in-memory) ────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(k => delete store[k]);
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
      multiGet: jest.fn((keys: string[]) => Promise.resolve(keys.map(k => [k, store[k] ?? null]))),
      multiSet: jest.fn((pairs: [string, string][]) => {
        pairs.forEach(([k, v]) => {
          store[k] = v;
        });
        return Promise.resolve();
      }),
      multiRemove: jest.fn((keys: string[]) => {
        keys.forEach(k => delete store[k]);
        return Promise.resolve();
      }),
    },
  };
});

// ─── @react-navigation/native ────────────────────────────────────
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  }),
  useRoute: () => ({
    params: {},
    name: 'MockRoute',
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
  createNavigationContainerRef: jest.fn(() => ({
    isReady: jest.fn(() => false),
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => false),
    getCurrentRoute: jest.fn(),
  })),
  NavigationContainer: ({ children }: any) => children,
}));

// ─── @react-navigation/stack ─────────────────────────────────────
jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
    Group: ({ children }: any) => children,
  })),
  CardStyleInterpolators: {
    forHorizontalIOS: jest.fn(),
    forVerticalIOS: jest.fn(),
  },
}));

// ─── expo-camera ─────────────────────────────────────────────────
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  },
  CameraView: 'CameraView',
  CameraType: { back: 'back', front: 'front' },
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

// ─── expo-image-picker ───────────────────────────────────────────
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'mock://image.jpg', width: 100, height: 100 }],
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'mock://camera.jpg', width: 100, height: 100 }],
    })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaTypeOptions: { Images: 'Images', All: 'All' },
}));

// ─── expo-location ───────────────────────────────────────────────
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 51.5074, longitude: -0.1278 } })
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([{ city: 'London', region: 'England', postalCode: 'SW1A 1AA' }])
  ),
}));

// ─── expo-av ─────────────────────────────────────────────────────
jest.mock('expo-av', () => {
  const mockRecording = {
    stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
    getURI: jest.fn(() => 'mock://recording.m4a'),
    getStatusAsync: jest.fn(() => Promise.resolve({ isRecording: true })),
  };
  const mockSound = {
    playAsync: jest.fn(() => Promise.resolve()),
    stopAsync: jest.fn(() => Promise.resolve()),
    unloadAsync: jest.fn(() => Promise.resolve()),
    setOnPlaybackStatusUpdate: jest.fn(),
  };
  return {
    Audio: {
      Recording: {
        createAsync: jest.fn(() => Promise.resolve({ recording: mockRecording })),
      },
      Sound: {
        createAsync: jest.fn(() => Promise.resolve({ sound: mockSound })),
      },
      requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, status: 'granted' })),
      setAudioModeAsync: jest.fn(() => Promise.resolve()),
      RecordingOptionsPresets: { HIGH_QUALITY: {} },
      AndroidOutputFormat: { MPEG_4: 2 },
      AndroidAudioEncoder: { AAC: 3 },
      IOSOutputFormat: { MPEG4AAC: 'aac' },
      IOSAudioQuality: { HIGH: 127 },
    },
  };
});

// ─── expo-font ───────────────────────────────────────────────────
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  useFonts: jest.fn(() => [true, null]),
}));

// ─── expo-haptics ────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// ─── expo-clipboard ──────────────────────────────────────────────
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

// ─── expo-print ──────────────────────────────────────────────────
jest.mock('expo-print', () => ({
  printAsync: jest.fn(() => Promise.resolve()),
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'mock://file.pdf' })),
}));

// ─── expo-sharing ────────────────────────────────────────────────
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// ─── expo-linear-gradient ────────────────────────────────────────
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// ─── @supabase/supabase-js ───────────────────────────────────────
const mockQueryBuilder = () => {
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    upsert: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    neq: jest.fn(() => builder),
    gt: jest.fn(() => builder),
    lt: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    like: jest.fn(() => builder),
    ilike: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => builder),
    maybeSingle: jest.fn(() => builder),
    match: jest.fn(() => builder),
    then: jest.fn((resolve: any) => resolve({ data: [], error: null })),
  };
  return builder;
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(() =>
        Promise.resolve({ data: { user: null, session: null }, error: null })
      ),
      signUp: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      refreshSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      setSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    from: jest.fn(() => mockQueryBuilder()),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  })),
}));

// ─── src/services/supabase (app singleton) ───────────────────────
jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      refreshSession: jest.fn(),
      setSession: jest.fn(),
    },
    from: jest.fn(() => mockQueryBuilder()),
  },
  authHelpers: {
    signIn: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    signUp: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    signUpTest: jest.fn(() =>
      Promise.resolve({ data: { user: null, session: null }, error: null })
    ),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  },
}));

// ─── react-native-purchases (RevenueCat) ─────────────────────────
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getOfferings: jest.fn(() => Promise.resolve({ current: null })),
    getCustomerInfo: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
    logIn: jest.fn(),
    logOut: jest.fn(),
  },
  PurchasesPackage: {},
  PurchasesOffering: {},
}));

// ─── src/services/RevenueCatService ──────────────────────────────
jest.mock('../src/services/RevenueCatService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(() => Promise.resolve()),
    setUserId: jest.fn(() => Promise.resolve()),
    clearUserId: jest.fn(() => Promise.resolve()),
    checkPremiumStatus: jest.fn(() =>
      Promise.resolve({
        isSubscribed: false,
        isPremium: false,
        expirationDate: null,
        willRenew: false,
        productIdentifier: null,
      })
    ),
    getOfferings: jest.fn(() => Promise.resolve(null)),
    purchasePackage: jest.fn(() => Promise.resolve({ success: false, error: 'Not configured' })),
    restorePurchases: jest.fn(() =>
      Promise.resolve({ success: false, isPremium: false, error: 'Not configured' })
    ),
  },
  ENTITLEMENT_ID: 'premium',
  PRODUCT_IDS: {
    MONTHLY: 'asktoddy_pro_monthly',
    ANNUAL: 'asktoddy_pro_annual',
  },
}));

// ─── react-native-safe-area-context ──────────────────────────────
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ─── react-native-gesture-handler ────────────────────────────────
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: 'Swipeable',
  DrawerLayout: 'DrawerLayout',
  State: {},
  ScrollView: 'ScrollView',
  Slider: 'Slider',
  Switch: 'Switch',
  TextInput: 'TextInput',
  ToolbarAndroid: 'ToolbarAndroid',
  ViewPagerAndroid: 'ViewPagerAndroid',
  DrawerLayoutAndroid: 'DrawerLayoutAndroid',
  WebView: 'WebView',
  NativeViewGestureHandler: 'NativeViewGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  FlingGestureHandler: 'FlingGestureHandler',
  ForceTouchGestureHandler: 'ForceTouchGestureHandler',
  LongPressGestureHandler: 'LongPressGestureHandler',
  PanGestureHandler: 'PanGestureHandler',
  PinchGestureHandler: 'PinchGestureHandler',
  RotationGestureHandler: 'RotationGestureHandler',
  GestureHandlerRootView: ({ children }: any) => children,
  Directions: {},
}));

// ─── src/services/NavigationService ──────────────────────────────
jest.mock('../src/services/NavigationService', () => ({
  navigationRef: {
    isReady: jest.fn(() => false),
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => false),
    getCurrentRoute: jest.fn(),
  },
  navigate: jest.fn(),
  goBack: jest.fn(),
  getCurrentRoute: jest.fn(),
}));

// ─── Silence console noise in tests ──────────────────────────────
const originalWarn = console.warn;
const originalError = console.error;
beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') || args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: An update to')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
