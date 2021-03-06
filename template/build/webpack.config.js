const path = require('path')
const webpack = require('webpack')
const userConfig = require('./config')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require("extract-text-webpack-plugin")

const outPath = userConfig.outPath
const srcPath = userConfig.srcPath
const publicPathJoinName = userConfig.publicPathJoinName
const publicPathName = userConfig.publicPathName
const jsOutJoinPathName = userConfig.jsOutJoinPathName
const assetsSubDirectory = path.posix.join(publicPathJoinName, userConfig.assetsDir)
const isProduction = process.env.NODE_ENV === 'production'

const postcssLoader = {
    loader: 'postcss-loader',
    options: {
        plugins: function() {
            return [
                require('autoprefixer')({
                    browsers: ['last 2 versions', 'ie 9']
                })
            ]
        }
    }
}
const vueOptions = isProduction ? {
    extractCSS: true,
    loaders: {
        css: ExtractTextPlugin.extract({
           use: 'css-loader',
           fallback: 'vue-style-loader'
        })
    }
}: undefined

module.exports = {
    entry: {
        dist: [path.resolve(__dirname, '../src/main.js')],
    },
    output: {
        // 设置输出文件夹来自配置
        path: outPath,
        // 设置所有输出文件的挂载url
        publicPath: publicPathName,
        // 设置输出文件路径及名字组成
        filename: path.posix.join(publicPathJoinName, jsOutJoinPathName, '[name]_[hash].js'),
        // 设置分割文件名及路径组成
        chunkFilename: path.posix.join(publicPathJoinName, jsOutJoinPathName, "chunk/[name]_[chunkhash:4].js") // -[chunkhash:4]
    },
    // 设置开启sourcemap
    devtool: '#source-map',
    resolve: {
        alias: {
            // 设置别名
            {{#if_eq build "standalone"}}
                'vue$': 'vue/dist/vue.esm.js',
            {{/if_eq}}
            '@': path.resolve(srcPath, './')
        },
        // require时省略的扩展名，如：require('module') 不需要module.js
        extensions: ['.js', '.vue']
    },
    // 初始化插件为空数组
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.template.html',
            inject: true
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: function (module) {
                return (
                    module.resource &&
                    /\.js$/.test(module.resource) &&
                    module.resource.indexOf(
                        path.join(__dirname, '../node_modules')
                    ) === 0
                )
            }
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'manifest'
        }),
    ],
    // 加载器的设置
    module: {
        // 加载器设置
        rules: [
            {{#lint}}
            {
                test: /\.(js|vue)/,
                use: 'eslint-loader',
                enforce: 'pre',
                include: [srcPath],
                exclude: /node_modules/
            },
            {{/lint}}
            {
                test: /\.vue/,
                use: [{
                    loader: 'vue-loader',
                    options: vueOptions
                }]
            }, {
                test: /\.js/,
                use: 'babel-loader',
                include: [srcPath],
                exclude: /node_modules/
            }, {
                test: /\.css/,
                use: isProduction ? ExtractTextPlugin.extract({
                      fallback: "style-loader",
                      use: ["css-loader", postcssLoader]
                }): ['style-loader', 'css-loader', postcssLoader]
            }, {
                test: /\.scss$/,
                use: isProduction ? ExtractTextPlugin.extract({
                      fallback: "style-loader",
                      use: ["css-loader", postcssLoader, 'sass-loader']
                }) : ['style-loader', 'css-loader', postcssLoader, 'sass-loader']
            }, {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        name: path.posix.join(assetsSubDirectory, 'img/[name].[hash:7].[ext]')
                    }
                }
            }, {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        name: path.posix.join(assetsSubDirectory, 'fonts/[name].[hash:7].[ext]')
                    }
                }
            }, {
                test: /\.json/,
                use: 'json-loader'
            }
        ]
    }
}
// 设置开发和部署时的配置却别
if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = false
    // http://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new ExtractTextPlugin(path.posix.join(assetsSubDirectory, "css/common.[chunkhash].css"))
    ])
}
if (process.env.ANALY === 'dev') {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
    module.exports.plugins.push(
        new BundleAnalyzerPlugin()
    )
}
