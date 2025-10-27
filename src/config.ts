/**
 * NusaLang Configuration System
 * Loads and validates .nusarc configuration
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface NusaConfig {
  port?: number;
  db?: 'json' | 'sqlite' | 'postgres';
  hotReload?: boolean;
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug';
  outDir?: string;
  sourceDir?: string;
  entry?: string;
}

export const DEFAULT_CONFIG: NusaConfig = {
  port: 3000,
  db: 'json',
  hotReload: true,
  logLevel: 'info',
  outDir: './dist',
  sourceDir: './src',
};

/**
 * Load .nusarc configuration from file
 */
export function loadConfig(configPath?: string): NusaConfig {
  const path = configPath || resolve(process.cwd(), '.nusarc');

  if (!existsSync(path)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = readFileSync(path, 'utf-8');
    const userConfig = JSON.parse(content) as Partial<NusaConfig>;

    // Validate and merge with defaults
    return {
      ...DEFAULT_CONFIG,
      ...userConfig,
    };
  } catch (error) {
    throw new Error(`Failed to load .nusarc: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate configuration values
 */
export function validateConfig(config: NusaConfig): string[] {
  const errors: string[] = [];

  if (config.port !== undefined && (config.port < 1 || config.port > 65535)) {
    errors.push('Port must be between 1 and 65535');
  }

  if (config.db && !['json', 'sqlite', 'postgres'].includes(config.db)) {
    errors.push('Database must be one of: json, sqlite, postgres');
  }

  if (config.logLevel && !['silent', 'error', 'warn', 'info', 'debug'].includes(config.logLevel)) {
    errors.push('Log level must be one of: silent, error, warn, info, debug');
  }

  return errors;
}

/**
 * Get a config value with type safety
 */
export function getConfigValue<K extends keyof NusaConfig>(
  config: NusaConfig,
  key: K
): NonNullable<NusaConfig[K]> {
  const value = config[key];
  if (value === undefined) {
    return DEFAULT_CONFIG[key] as NonNullable<NusaConfig[K]>;
  }
  return value as NonNullable<NusaConfig[K]>;
}

