const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const dirs = require('./dirs.config.js');
module.exports = {

    rules: [
        {
            test: /\.ts$/,
            loader: 'ts-loader',
            options:{allowTsInNodeModules:true}
        },
        // {
        //     test: require.resolve('jquery'),
        //     loader: 'expose-loader',
        //     options: {
        //         exposes: ['$', 'jQuery'],
        //     },
        // },
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },
        {
            test: /\.scss/,
            use: ExtractTextPlugin.extract('css?minimize&-autoprefixer!postcss!sass')
        },
        {
            test: /\.html$/,
            use: 'html-loader?-minimize'
        },
        {
            test: /\.ejs$/,
            include: [dirs.srcDir],
            use: 'ejs-loader',
        },
        {
            test: /\.(woff|woff2|ttf|eot|svg)(\?[t,v]=[0-9]\.[0-9]\.[0-9])?$/,
            use: 'file-loader?name=_fonts/[name].[ext]'
        },
        {
            test: /\.(gif|jpe?g|png)\??.*$/,
            use: 'url-loader?limit=50000&name=_images/[name]-[hash].[ext]'
        },
        {
            test: /\.js$/, // 1.匹配 .css 结尾的文件,注意test的值不是一个字符串，而是一个正则
            exclude: /(node_modules|bower_components|jstree.js)/, // 2.排除这两个文件不需要打包
            // 3.使用babel-loader编译js代码
            use: [
                {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env'
                        ]
                    }
                }]
        },
        {
            test: /\.json$/,
            use: 'json-loader'
        }
    ]
};
