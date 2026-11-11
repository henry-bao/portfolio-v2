import { Account, Client, Functions, Storage, TablesDB } from 'appwrite';
import { parseBackendConfig } from './env';
import type { BackendConfig } from './env';
import { ApiError } from './errors';

interface Backend {
    config: BackendConfig;
    account: Account;
    tablesDB: TablesDB;
    storage: Storage;
    functions: Functions;
}

const configResult = parseBackendConfig(import.meta.env);

if (!configResult.ok) {
    // Logged once instead of crashing the page: public sections fall back to built-in content.
    console.error(`Appwrite is not configured, so no data will load:\n- ${configResult.problems.join('\n- ')}`);
}

const backend: Backend | null = configResult.ok
    ? (() => {
          const client = new Client().setEndpoint(configResult.config.endpoint).setProject(configResult.config.projectId);

          return {
              config: configResult.config,
              account: new Account(client),
              tablesDB: new TablesDB(client),
              storage: new Storage(client),
              functions: new Functions(client),
          };
      })()
    : null;

/**
 * The configured Appwrite services. Throws an `ApiError` of kind `misconfigured` when the env vars are
 * invalid, so every data call fails the same predictable way instead of sending broken requests.
 */
export function getBackend(): Backend {
    if (!backend) {
        throw new ApiError('misconfigured', 'Appwrite environment variables are missing or invalid');
    }

    return backend;
}

/** Non-throwing variant for synchronous render paths such as building file URLs. */
export const getBackendOrNull = (): Backend | null => backend;
