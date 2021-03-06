# entry-chunk-webpack-plugin
A webpack plugin that splits one entry file into multiple files and add them to entry of webpack.


## Install

```bash
npm i -D entry-chunk-webpack-plugin
``` 


## Usage

In your webpack configuration (`webpack.config.js`):

```javascript
const EntryChunkWebpackPlugin = require('entry-chunk-webpack-plugin');
const LibraryExtendWebpackPlugin = require('library-extend-webpack-plugin');

module.exports = {
    mode: "production",
    entry: {
        example: './src/index.ts',
    },
    output: {
        library: "LIB",
        libraryTarget: "umd",
        filename: '[name].js'
    },
    //...
    plugins: [
        new EntryChunkWebpackPlugin({
            chunkConfig: [{
                name: 'example.base',
            }, {
                name: 'example.extend',
                modules: ['RichEditor', 'ReactCropper']
            }],
        }),
        new LibraryExtendWebpackPlugin({
            exclude: function (fileName) {
                return !/\.[tj]s$/i.test(fileName) || /example(\.base)*(\.min)*\.js/.test(fileName);
            }
        }),
    ]
}
```


### Entry File: `index.ts`

```javascript
export { default as Avatar } from './components/avatar/index';

export { default as Button } from './components/button/button';

export { default as RichEditor } from './components/rich-editor/index';

export { default as ReactCropper } from './components/react-cropper/index';

```


### Output Bundle

It will output 3 files
```javascript
example.js ({ Avatar, Button, RichEditor, ReactCropper })
example.base.js ({ Avatar, Button })
example.extend.js ({ RichEditor, ReactCropper })
```

`Avatar` and `Button`  will be packaged to `example.base.js`.    
`RichEditor` and `ReactCropper` will be packaged to `example.extend.js`.


Function `Avatar`, `Button`, `RichEditor` and `ReactCropper` are added to global library `LIB`.  
And `LIB.Avatar`, `LIB.Button`, `LIB.RichEditor` and `LIB.ReactCropper` work well.


## Options

### mode

Its value can be `'add'` or `'replace'` or `''`. The default value is `add`.  

`'add'`: means will add chunk file to entry.  
`'replace'`: means will remove original entry file, and add chunk file to entry.  
`''`: means will not add chunk file to entry.  

### min

Its value must be boolean or `'both'`. The default value is `false`.  

`true`: it will add `[name].min.js` to entry.  
`false`: it will add `[name].js` to entry.  
`'both'`: it will both add `[name].js` and `[name].min.js` to entry.  

### chunkConfig

Its value must be Array.
You need to config it to split entry file into multiple files as example.

### exclude

You can skip entry file by `exclude`: ({name, path}) => boolean


## Example of usage on the Browser

In the browser:

```html
<script src="https://cdn.xx.com/example.base.js"></script>
<script src="https://cdn.xx.com/example.extend.js"></script>
```

If you do not use the module (`RichEditor` and `ReactCropper`) in `example.extend.js`, you can only add `example.base.js` to html. 
Because in the example, [library-extend-webpack-plugin](https://github.com/kingller/library-extend-webpack-plugin) is used to package `example.extend.js` into an extension library.

```html
<script src="https://cdn.xx.com/example.base.js"></script>
```
