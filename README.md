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
        'example.min': './src/index.ts',
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

It will output 6 files
```javascript
example.js ({ Avatar, Button, RichEditor, ReactCropper })
example.min.js ({ Avatar, Button, RichEditor, ReactCropper })
example.base.js ({ Avatar, Button })
example.base.min.js ({ Avatar, Button })
example.extend.js ({ RichEditor, ReactCropper })
example.extend.min.js ({ RichEditor, ReactCropper })
```

`Avatar` and `Button`  will be packaged to `example.base.js`.    
`RichEditor` and `ReactCropper` will be packaged to `example.extend.js `.


Function `Avatar`, `Button`, `RichEditor` and `ReactCropper` are added to global library `LIB`.  
And `LIB.Avatar`, `LIB.Button`, `LIB.RichEditor` and `LIB.ReactCropper` work well.


## Options

### mode

Its value can be `add` or `replace` or ''. The default value is `add`.  
`add`: means will add chunk file to entry.  
`replace`: means will remove original entry file, and add chunk file to entry.  
'': means will not add chunk file to entry.  

### min
Its value must be boolean. The default value is `true`.  
When it's true, it will add min to entry as above. Otherwise the `xx.min.js` will not be added to entry.

### chunkConfig
Its value must be Array.
You need to config it to split entry file into multiple files as example.


## Example of usage on the Browser

In the browser:

```html
<script src="https://cdn.xx.com/example.base.min.js"></script>
<script src="https://cdn.xx.com/example.extend.min.js"></script>
```
