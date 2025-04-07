const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	mode: "development",
	entry: {
		main: {
			import: "./src/js/index.js",
		},
		design: {
			import: "./src/js/content-page.js"
		},
		training: {
			import: "./src/js/training.js"
		},
		setup: {
			import: "./src/js/setup.js"
		}
	},
	output: {
		filename: "assets/js/[name].bundle.js",
		path: path.resolve(__dirname, "dist"),
		assetModuleFilename: "assets/content/[name][ext]",
	},
	devServer: {
		static: path.resolve(__dirname, "dist"),
		host: '0.0.0.0',
		port: 8080,
		open: true,
		hot: true,
	},
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: ["style-loader", "css-loader", "sass-loader"],
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: "index.html",
			template: "./src/index.html",
			chunks: ["main"],
		}),
		new HtmlWebpackPlugin({
			filename: "design.html",
			template: "./src/design.html",
			chunks: ["design"],
		}), new HtmlWebpackPlugin({
			filename: "training.html",
			template: "./src/training.html",
			chunks: ["training"],
		}),
		new HtmlWebpackPlugin({
			filename: "bar-setup.html",
			template: "./src/bar-setup.html",
			chunks: ["setup"],
		})
	],
};