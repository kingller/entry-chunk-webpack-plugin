const path = require('path');
const fs = require('fs');
const PLUGIN_NAME = 'EntryChunkWebpackPlugin';
const warn = msg => console.warn(`[${PLUGIN_NAME}] ${msg}`);

/**
 * @class EntryChunkWebpackPlugin
 */
class EntryChunkWebpackPlugin {
  /**
   * @constructor
   * @param {Object} [options]
   * @param {String: 'add' | 'replace' | ''} [options.mode]
   * @param {Boolean} [options.min]
   * @param {Array({ name: string, modules: string[] })} [options.chunkConfig]
   * @param {Function: ({name, path}) => boolean} [options.exclude]
   */
  constructor(options) {
    this._options = Object.assign({
      mode: 'add', // 'add' || 'replace' || '',
      min: true,
      chunkConfig: [], // { name: string, modules: [] }
      exclude: function (file) { return false; },
    }, options);
  }

  /**
   * @method apply
   * @param {Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.entryOption.tap(PLUGIN_NAME, (context, entry) => {
      const { mode, chunkConfig, exclude } = this._options;
      if (!chunkConfig || !chunkConfig.length) {
        warn(`options.chunkConfig should not be empty.`)
        return;
      }

      if (mode !== 'add' && mode !== 'replace' && mode !== '') {
        warn(`options.mode should be 'add' or 'replace' or ''. Its default value is 'add'.`)
        return;
      }

      let cloneEntry = Object.assign({}, entry);
      if (mode === 'replace') {
        for (let key in entry) {
          delete entry[key];
        }
      }
      let isResolvedMap = {};
      for (let key in cloneEntry) {
        const currentPath = cloneEntry[key];

        if (
          typeof currentPath !== 'string' ||
          (exclude &&
            exclude({
              name: key,
              path: currentPath
            }))
        ) {
          continue;
        }

        let absolutePath = currentPath;
        if (!path.isAbsolute(absolutePath)) {
          absolutePath = path.resolve(context, absolutePath);
        }

        // If the path is resolved, then continue
        if (isResolvedMap[absolutePath]) {
          continue;
        }
        isResolvedMap[absolutePath] = true;

        const source = fs.readFileSync(absolutePath).toString();

        let noConfigModulesChunk = [];
        let modulesInChunkMap = {};
        chunkConfig.forEach((chunk) => {
          const { name, modules } = chunk;
          if (modules && modules.length > 0) {
            // generate config modules file and add it to entry
            splitEntryFileIntoChunkFile.bind(this)(
              entry,
              absolutePath,
              name,
              function (chunkEntryFilePath) {
                outputFileByModules(source, chunkEntryFilePath, modules, modulesInChunkMap);
              }
            );
          } else {
            noConfigModulesChunk.push(chunk);
          }
        });

        // generate no config modules file and add it to entry
        noConfigModulesChunk.forEach((chunk) => {
          splitEntryFileIntoChunkFile.bind(this)(
            entry,
            absolutePath,
            chunk.name,
            function (chunkEntryFilePath) {
              outputNoConfigModulesFile(source, chunkEntryFilePath, modulesInChunkMap);
            }
          );
        });
      }
    });
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function splitEntryFileIntoChunkFile(entry, entryFilePath, chunkName, outputFileCallback) {
  const chunkEntryFilePath = generateChunkEntryFilePath(entryFilePath, chunkName);
  outputFileCallback(chunkEntryFilePath);

  const { mode } = this._options;
  if (mode === 'add' || mode === 'replace') {
    addEntry.bind(this)(entry, chunkName, chunkEntryFilePath);
  }
}

function addEntry(entry, name, filePath) {
  const { min } = this._options;

  entry[name] = filePath;
  if (min) {
    entry[`${name}.min`] = filePath;
  }
}

function generateMatchModuleRegExp(moduleName) {
  return new RegExp(`export\\s+\\{\\s*default\\s+as\\s+${escapeRegExp(moduleName)}\\s*\\}\\s+from\\s+[']\\.?(.+)['];*`);
}

function outputFileByModules(source, filePath, modules, modulesInChunkMap) {
  let modulesSource = [];
  modules.forEach(function (moduleName) {
    const matchModuleRegExp = generateMatchModuleRegExp(moduleName);
    const matchModuleSource = source.match(matchModuleRegExp);
    if (matchModuleSource) {
      modulesSource.push(matchModuleSource[0]);
      modulesInChunkMap[moduleName] = moduleName;
    }
  });

  const entryChunkSource = modulesSource.join('\n') + '\n';
  writeEntryChunkFileSync(filePath, entryChunkSource);
}

function outputNoConfigModulesFile(source, filePath, modulesInChunkMap) {
  const modulesInChunk = Object.keys(modulesInChunkMap);
  modulesInChunk.forEach(function (moduleName) {
    const matchModuleRegExp = generateMatchModuleRegExp(moduleName);
    source = source.replace(matchModuleRegExp, '');
  });
  source = source.replace(/\n{3,}/g, '\n\n');
  writeEntryChunkFileSync(filePath, source);
}

function writeEntryChunkFileSync(filePath, source) {
  // add ../ to source file path
  source = source.replace(/[']((\.\/)|(\.\.\/))?(.+)(['];*)/g, '\'$1..\/$4$5');

  const folderDir = filePath.match(/(.*\/)[^\/]+$/)[1];
  if (!fs.existsSync(folderDir)) {
    fs.mkdirSync(folderDir);
  }
  fs.writeFileSync(filePath, source);
}

function generateChunkEntryFilePath(filePath, name) {
  return filePath.replace(/(.*\/)[^\/]+(\.[^\.^\/]+)$/, `$1webpack-entry-chunk\/${name}$2`);
}

// Exports
module.exports = EntryChunkWebpackPlugin;
