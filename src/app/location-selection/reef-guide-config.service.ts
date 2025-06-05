import {
  computed,
  effect,
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

interface StoredConfig {
  arcgisMap: string;
  customArcgisMapItemId: string;
  enabledRegions: Array<string>;
  parallelRegionRequests: boolean;
  enableCOGBlob: boolean;
}

const VALUE_SEPARATOR = '\x1F';

function getArray(val: string): Array<string> {
  return val.split(VALUE_SEPARATOR);
}

function getBoolean(val: string): boolean {
  return val === 'true';
}

/**
 * Functions for converting localstorage string value for
 * variables that aren't a string type.
 *
 * TODO fix types so this errors if add property to StoredConfig
 */
const configVarGetters: Partial<
  Record<keyof StoredConfig, (val: string) => any>
> = {
  enabledRegions: getArray,
  parallelRegionRequests: getBoolean,
  enableCOGBlob: getBoolean
};

interface Map {
  // ID that will never change for this map
  id: string;
  name: string;
  arcgisItemId: string;
}

export const MAPS: Array<Map> = [
  // minimalistic map, loads quicker, useful for development
  {
    id: 'simple',
    name: 'Simple',
    arcgisItemId: 'd7404f1b7eed4269b0028a0a6b698000',
  },
  // Decision Sim prototype
  {
    id: 'DecisionSim',
    name: 'Decision Sim 2 v1_5 GS',
    arcgisItemId: 'fee03c9e65a8413f8b0bb8c158c7f040',
  },
];

const DEFAULT_MAP = MAPS[0];

export const ALL_REGIONS = [
  'Townsville-Whitsunday',
  'Cairns-Cooktown',
  'Mackay-Capricorn',
  'FarNorthern',
];

@Injectable({
  providedIn: 'root',
})
export class ReefGuideConfigService {
  readonly authService = inject(AuthService);

  /**
   * ID of predefined ArcGIS map.
   */
  arcgisMap: WritableSignal<string>;
  /**
   * Custom ArcGIS item id for arcgisMap.
   */
  customArcgisMapItemId: WritableSignal<string | undefined>;
  /**
   * Enabled regions for ReefGuideAPI
   */
  enabledRegions: WritableSignal<Array<string>>;
  /**
   * Request all regions simultaneously.
   * Otherwise sequential requests.
   */
  parallelRegionRequests: WritableSignal<boolean>;

  /**
   * Enable copying of COG files to in-memory Blob, which improves performance.
   *
   * Currently this is always done if enabled; in the future only COGs under a
   * certain file size will be copied to Blob.
   */
  enableCOGBlob: WritableSignal<boolean>;

  // computed signals
  /**
   * ArcGIS item id for arcgisMap.
   */
  arcgisMapItemId: Signal<string>;

  isAdmin = toSignal(this.authService.isAdmin());

  /**
   * Disables set from writing to local storage
   */
  private readonly = true;

  private readonly prefix = 'rg.';

  constructor() {
    this.arcgisMap = signal(this.get('arcgisMap', DEFAULT_MAP.id));
    this.customArcgisMapItemId = signal(this.get('customArcgisMapItemId'));

    this.arcgisMapItemId = computed(() => {
      const mapId = this.arcgisMap();
      if (mapId === 'CUSTOM') {
        return this.customArcgisMapItemId() ?? DEFAULT_MAP.arcgisItemId;
      } else {
        let map = MAPS.find(m => m.id === mapId);
        if (map === undefined) {
          console.warn(
            `No Map found with id="${mapId}", defaulting to "${DEFAULT_MAP.id}"`
          );
          map = DEFAULT_MAP;
        }
        return map.arcgisItemId;
      }
    });

    this.enabledRegions = signal(this.get('enabledRegions', ALL_REGIONS));
    this.parallelRegionRequests = signal(
      this.get('parallelRegionRequests', true)
    );
    this.enableCOGBlob = signal(this.get('enableCOGBlob', true));

    effect(() => this.set('arcgisMap', this.arcgisMap()));
    effect(() =>
      this.set('customArcgisMapItemId', this.customArcgisMapItemId())
    );
    effect(() => this.set('enabledRegions', this.enabledRegions()));
    effect(() =>
      this.set('parallelRegionRequests', this.parallelRegionRequests())
    );
    effect(() => this.set('enableCOGBlob', this.enableCOGBlob()));

    // ignore the first effect, which would set the initial value.
    // effects are async, so run in microtask.
    Promise.resolve().then(() => {
      this.readonly = false;
    });
  }

  private get<K extends keyof StoredConfig, V = StoredConfig[K]>(
    key: K
  ): V | undefined;
  private get<K extends keyof StoredConfig, V = StoredConfig[K]>(
    key: K,
    dflt: V
  ): V;
  private get<K extends keyof StoredConfig, V = StoredConfig[K]>(
    key: K,
    dflt?: V
  ): V | undefined {
    let val = localStorage.getItem(`${this.prefix}${key}`);
    if (val == null) {
      return dflt ?? undefined;
    } else {
      const getFn = configVarGetters[key];
      return getFn !== undefined ? getFn(val) : val;
    }
  }

  private set<K extends keyof StoredConfig, V = StoredConfig[K]>(
    key: K,
    value: V
  ) {
    if (this.readonly) {
      return;
    }

    let storedVal: string;
    if (Array.isArray(value)) {
      // split with unit separator character
      storedVal = value.join(VALUE_SEPARATOR);
    } else {
      // local storage converts values to strings.
      storedVal = value as string;
    }

    localStorage.setItem(`${this.prefix}${key}`, storedVal);
  }
}
