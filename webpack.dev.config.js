const validate = require('webpack-validator');
var config = require('./webpack-config/webpack.dev.config');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const dirs = require('./webpack-config/common/dirs.dev.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// json loader，nhd
config.module.rules.push({test: /\.json$/, loader: 'json'});

// 拷贝config.json文件。处理html模板文件
config.plugins.push(new CopyWebpackPlugin(
    {
        patterns: [
            {from: './config.json', to: './config.json'}
        ]
    }
));
config.optimization = {noEmitOnErrors: true, minimize: true};

config.plugins.push(
    new HtmlWebpackPlugin({
            filename: 'index.html',
            template: dirs.srcDir + '/index.html',
            inject: 'true',
            chunks: ['webpackAssets', 'vendor', 'common', 'index'],
            chunksSortMode: 'auto'
        }
    ));
module.exports = config;
