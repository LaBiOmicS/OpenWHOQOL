
import { AppData, ExternalStorageConfig } from '../types';
import { INITIAL_APP_DATA } from '../constants';

const DB_NAME = 'OpenWHOQOL_DB';
const DB_VERSION = 1;
const STORE_NAME = 'appDataStore';
const DATA_KEY = 'main';
const EXTERNAL_CONFIG_KEY = 'openwhoqol_ext_config';

/**
 * Instância do banco de dados.
 */
let db: IDBDatabase | null = null;

// --- External Storage Configuration Helpers ---

export const getExternalConfig = (): ExternalStorageConfig => {
    try {
        const stored = localStorage.getItem(EXTERNAL_CONFIG_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn("Error accessing localStorage:", e);
    }
    return { enabled: false, endpointUrl: '', apiKey: '' };
};

export const saveExternalConfig = (config: ExternalStorageConfig) => {
    try {
        localStorage.setItem(EXTERNAL_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
        console.error("Error saving to localStorage:", e);
        // Não exibir alerta para evitar spam, apenas logar
    }
};

// --- External API Helpers ---

export const syncFromExternal = async (config: ExternalStorageConfig): Promise<AppData> => {
    if (!config.enabled || !config.endpointUrl) throw new Error("External storage disabled");
    
    const response = await fetch(config.endpointUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey
        }
    });
    
    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Validação básica da estrutura
    if (!data || !data.admin || !Array.isArray(data.participants)) {
        throw new Error("Invalid data structure received from external API");
    }
    
    return data as AppData;
};

export const syncToExternal = async (config: ExternalStorageConfig, data: AppData): Promise<void> => {
    if (!config.enabled || !config.endpointUrl) throw new Error("External storage disabled");
    
    const response = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`Save failed: ${response.status} ${response.statusText}`);
    }
};

// --- IndexedDB Logic ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("Erro ao abrir o banco de dados IndexedDB."));
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = () => {
      const tempDb = request.result;
      if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
        const store = tempDb.createObjectStore(STORE_NAME);
        store.transaction.oncomplete = () => {
            const dataTransaction = tempDb.transaction(STORE_NAME, 'readwrite');
            const dataStore = dataTransaction.objectStore(STORE_NAME);
            dataStore.put(INITIAL_APP_DATA, DATA_KEY);
        };
      }
    };
  });
}

async function getAppDataFromIDB(): Promise<AppData> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(DATA_KEY);

    request.onsuccess = () => resolve(request.result || INITIAL_APP_DATA);
    request.onerror = () => reject(new Error("Erro ao buscar dados do IndexedDB."));
  });
}

async function saveAppDataToIDB(data: AppData): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, DATA_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Erro ao salvar dados no IndexedDB."));
  });
}

// --- Main Exported Functions (Hybrid) ---

/**
 * Retrieves AppData. Tries external API first if configured, falls back to IndexedDB.
 */
export async function getAppData(): Promise<AppData> {
  const config = getExternalConfig();
  
  // 1. Try External (Sync Pull)
  if (config.enabled && config.endpointUrl) {
      try {
          const externalData = await syncFromExternal(config);
          // Se bem sucedido, atualiza o cache local
          await saveAppDataToIDB(externalData);
          return externalData;
      } catch (e) {
          console.warn("External load failed, falling back to local IndexedDB:", e);
      }
  }
  
  // 2. Fallback to Local
  // Tenta acessar o localStorage com segurança
  try {
      return await getAppDataFromIDB();
  } catch(e) {
       console.error("Critical error accessing IndexedDB:", e);
       // Último recurso: retornar dados iniciais se tudo falhar
       return INITIAL_APP_DATA;
  }
}

/**
 * Saves AppData. Always saves to IndexedDB, then tries to push to external API if configured.
 * Background save failures are logged but do not reject the promise to keep UI responsive.
 */
export async function saveAppData(data: AppData): Promise<void> {
  // 1. Save Local (Source of Truth for Offline)
  try {
      await saveAppDataToIDB(data);
  } catch (e) {
      console.error("Critical error saving to IndexedDB:", e);
      // Não impede a tentativa de salvar externamente se configurado
  }

  // 2. Save External (Sync Push)
  const config = getExternalConfig();
  if (config.enabled && config.endpointUrl) {
    try {
        await syncToExternal(config, data);
    } catch (e) {
        console.error("Background external save failed:", e);
        // Não lançamos erro aqui para não travar a UI do usuário.
        // A aba 'Banco de Dados' permitirá verificação manual.
    }
  }
}
