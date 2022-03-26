import { join, dirname } from 'node:path';

/**
 * Allow modules to be imported without an extension. Supports cache busting.
 * 
 * @param specifier {string} - Nodejs specifier
 * @param context {object} - Extract parentURL to get absolute path for import
 * @param defaultResolve {function} - Use this to fallback to default behavior
 */
export async function resolve(specifier, context, defaultResolve) {
  // Not a relative path or a file, so must be a node module.
  if (specifier.indexOf('file://') !== 0 && specifier[0] !== '/' && specifier[0] !== '.') {
    return defaultResolve(specifier);
  }

  let url = specifier.replace('file://', '');

  if (url[0] !== '/') {
    url = join(dirname(context.parentURL.replace('file://', '')), url);
  }

  // Remove file protocol
  url = url.replace('file://', '');

  let resolved = null;

  try {
    resolved = await defaultResolve(url);
  }
  catch {
    // Support cache busting
    const parts = url.split('?');

    try {
      // First try with `.js`.
      if (parts.length > 1) {
        resolved = await defaultResolve(parts[0] + '.js?' + parts[1]);
      }
      else {
        resolved = await defaultResolve(parts[0] + '.js');
      }
    }
    catch {
      const dir = parts[0];

      // Otherwise try with index.js
      if (parts.length > 1) {
        resolved = await defaultResolve(parts[0] + 'index.js?' + parts[1]);
      }
      else {
        resolved = await defaultResolve(parts[0] + 'index.js');
      }
    }
  }

  // Default to CJS
  if (!resolved.format) {
    return { ...resolved, format: 'commonjs' };
  }

  // Use module
  return resolved;
}
