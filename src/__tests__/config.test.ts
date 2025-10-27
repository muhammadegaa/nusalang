import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, validateConfig, getConfigValue, DEFAULT_CONFIG } from '../config.js';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';

const TEST_CONFIG_PATH = resolve(process.cwd(), '.nusarc.test');

describe('NusaLang Configuration', () => {
  afterEach(() => {
    // Clean up test config file
    if (existsSync(TEST_CONFIG_PATH)) {
      unlinkSync(TEST_CONFIG_PATH);
    }
  });

  it('should load default config when no .nusarc exists', () => {
    const config = loadConfig('/nonexistent/path/.nusarc');
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('should load and merge user config with defaults', () => {
    const userConfig = {
      port: 4000,
      db: 'sqlite' as const,
      logLevel: 'debug' as const,
    };

    writeFileSync(TEST_CONFIG_PATH, JSON.stringify(userConfig));
    const config = loadConfig(TEST_CONFIG_PATH);

    expect(config.port).toBe(4000);
    expect(config.db).toBe('sqlite');
    expect(config.logLevel).toBe('debug');
    expect(config.hotReload).toBe(DEFAULT_CONFIG.hotReload); // Should inherit default
  });

  it('should validate port range', () => {
    const invalidConfig = { ...DEFAULT_CONFIG, port: 70000 };
    const errors = validateConfig(invalidConfig);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Port must be between');
  });

  it('should validate database type', () => {
    const invalidConfig = { ...DEFAULT_CONFIG, db: 'invalid' as any };
    const errors = validateConfig(invalidConfig);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Database must be one of');
  });

  it('should validate log level', () => {
    const invalidConfig = { ...DEFAULT_CONFIG, logLevel: 'invalid' as any };
    const errors = validateConfig(invalidConfig);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Log level must be one of');
  });

  it('should get config value with type safety', () => {
    const config = { ...DEFAULT_CONFIG, port: 4000 };
    const port = getConfigValue(config, 'port');

    expect(port).toBe(4000);
    expect(typeof port).toBe('number');
  });

  it('should return default value for undefined config keys', () => {
    const config = { ...DEFAULT_CONFIG };
    delete config.port;

    const port = getConfigValue(config, 'port');
    expect(port).toBe(DEFAULT_CONFIG.port);
  });
});

