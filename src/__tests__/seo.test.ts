import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('SEO and public static assets', () => {
  it('transforms index.html in production web build with SEO metadata', async () => {
    delete process.env.TAURI_ENV_PLATFORM;

    const { default: configFn } = await import('../../vite.config');
    const result: any = await configFn({ mode: 'production', command: 'build' });

    const plugins = Array.isArray(result.plugins) ? result.plugins.flat(Infinity) : [];
    const seoPlugin = plugins.find((plugin: any) => plugin?.name === 'vite-plugin-pages-seo');
    expect(seoPlugin).toBeDefined();

    const inputHtml = '<html><head></head><body></body></html>';
    const outputHtml = await seoPlugin.transformIndexHtml(inputHtml);

    expect(outputHtml).toContain('name="google-site-verification" content="8gyf0epD2fOstHMcVqJ9szbLza7T4MvDH0SRVi2XlCc"');
    expect(outputHtml).toContain('<link rel="canonical" href="https://tyama11.github.io/questrack/"');
    expect(outputHtml).toContain('name="description"');
    expect(outputHtml).toContain('href="./about/"');

    const headCloseIndex = outputHtml.indexOf('</head>');
    const verificationIndex = outputHtml.indexOf('name="google-site-verification" content="8gyf0epD2fOstHMcVqJ9szbLza7T4MvDH0SRVi2XlCc"');
    const aboutLinkIndex = outputHtml.indexOf('href="./about/"');

    expect(headCloseIndex).toBeGreaterThan(-1);
    expect(verificationIndex).toBeGreaterThan(-1);
    expect(aboutLinkIndex).toBeGreaterThan(-1);
    expect(verificationIndex).toBeLessThan(headCloseIndex);
    expect(aboutLinkIndex).toBeGreaterThan(headCloseIndex);

    const scriptMatch = outputHtml.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    expect(scriptMatch).not.toBeNull();
    const ldJsonContent = scriptMatch ? scriptMatch[1] : '';
    const parsedJson = JSON.parse(ldJsonContent);
    expect(parsedJson['@type']).toBe('SoftwareApplication');
  });

  it('preserves html identically in desktop mode', async () => {
    const { default: configFn } = await import('../../vite.config');
    const result: any = await configFn({ mode: 'desktop', command: 'build' });

    const plugins = Array.isArray(result.plugins) ? result.plugins.flat(Infinity) : [];
    const seoPlugin = plugins.find((plugin: any) => plugin?.name === 'vite-plugin-pages-seo');
    expect(seoPlugin).toBeDefined();

    const inputHtml = '<html><head></head><body></body></html>';
    const outputHtml = await seoPlugin.transformIndexHtml(inputHtml);
    expect(outputHtml).toBe(inputHtml);
  });

  it('validates public/about/index.html and public/about/en/index.html', () => {
    const jaPath = resolve(process.cwd(), 'public/about/index.html');
    const enPath = resolve(process.cwd(), 'public/about/en/index.html');

    const jaHtml = readFileSync(jaPath, 'utf8');
    const enHtml = readFileSync(enPath, 'utf8');

    expect(jaHtml).toContain('<html lang="ja"');
    const jaH1Count = (jaHtml.match(/<h1\b/gi) || []).length;
    expect(jaH1Count).toBe(1);
    expect(jaHtml).toContain('<link rel="canonical" href="https://tyama11.github.io/questrack/about/"');

    expect(enHtml).toContain('<html lang="en"');
    const enH1Count = (enHtml.match(/<h1\b/gi) || []).length;
    expect(enH1Count).toBe(1);
    expect(enHtml).toContain('<link rel="canonical" href="https://tyama11.github.io/questrack/about/en/"');

    const requiredAlternates = [
      'hreflang="ja"',
      'hreflang="en"',
      'hreflang="x-default"',
    ];

    for (const alt of requiredAlternates) {
      expect(jaHtml).toContain(alt);
      expect(enHtml).toContain(alt);
    }
  });

  it('validates public/sitemap.xml entries', () => {
    const sitemapPath = resolve(process.cwd(), 'public/sitemap.xml');
    const sitemapContent = readFileSync(sitemapPath, 'utf8');

    expect(sitemapContent).toContain('<loc>https://tyama11.github.io/questrack/</loc>');
    expect(sitemapContent).toContain('<loc>https://tyama11.github.io/questrack/about/</loc>');
    expect(sitemapContent).toContain('<loc>https://tyama11.github.io/questrack/about/en/</loc>');
  });
});
