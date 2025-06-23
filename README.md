# Pluto Syntax Highlighting

For information regarding the installation, features, & usage of this editor integration, [have a look at our documentation](https://plutolang.github.io/docs/Editor%20Integration).

## Development

If you don't have Git installed, [do so first](https://github.com/git-guides/install-git).

In Sublime Text, select **Preferences > Browse Packages...** to open the "Packages" folder of your ST installation.

Open a console in this folder to run the following command:
```
git clone https://github.com/PlutoLang/Syntax-Highlighting "Pluto Syntax Highlighting"
```

You should now see "Pluto" as a syntax highlighting option in Sublime Text.

To run the regression tests, install dependencies with `npm install`, generate the baseline with `npm run generate-baseline`, then execute `npm test`.

## License

This project is provided under the Unlicense (dedicated to the public domain). However, it is based on https://github.com/LuaLS/lua.tmbundle, which itself is based on https://github.com/textmate/lua.tmbundle. All of these projects have different licenses. I'm not a lawyer, but from what I can tell, all of these licenses permit commerical use, private use, modification, & distribution while not providing any warranty.
