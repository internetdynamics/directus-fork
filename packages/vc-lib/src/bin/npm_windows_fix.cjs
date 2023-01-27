/**
 * Copyright (c) 2022 ddomen (Daniele Domenichelli <daniele.domenichelli.5@gmail.com>)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * This file search in the current node global node_module directory
 * for symbolic link that were not converted to windows version and
 * fix them. It can be useful to track the files that are modified
 * (the program will output a log of the binding symbolic links edited)
 *
 * USAGE: node npm_windows_fix.js
 * Make sure to use the correct version of node you are interested
 * to inspect (e.g. nvm use x.x.x and then run this program)
 */

const fs = require('fs');
const path = require('path');

function exploreFolder(folder) {
    const content = fs.readdirSync(folder, { withFileTypes: true });
    content.forEach(s => {
        const target = path.join(folder, s.name);
        if (s.isDirectory()) { return exploreFolder(target); }
        if (!s.isFile()) { return; }
        const stats = fs.statSync(target);
        if (stats.size > 1000) { return; }
        checkFile(target);
    });
}

function checkFile(file) {
    file = fs.realpathSync(file);
    const data = fs.readFileSync(file).toString('utf8');
    if (!data.startsWith('..')) { return; }
    const target = fs.realpathSync(path.join(path.dirname(file), data));
    const stats = fs.statSync(target);
    fs.rmSync(file);
    fs.symlinkSync(target, file, stats.isDirectory() ? 'dir' : 'file');
    console.log(target + ' <===> ' + file);
}

function main() {
    const node_exe = fs.realpathSync(process.argv[0]);
    if (!node_exe) {
        console.error('[ERROR]: node executable path not found');
        return 1;
    }
    const node_root = fs.realpathSync(path.dirname(node_exe));
    exploreFolder(node_root);
    console.log('DONE');
}
process.exit(main());

/*
DESIRED OUTPUT:
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\arborist <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\@npmcli\arborist
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmaccess <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmaccess
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmdiff <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmdiff
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmexec <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmexec
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmfund <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmfund
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmhook <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmhook
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmorg <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmorg
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmpack <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmpack
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmpublish <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmpublish
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmsearch <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmsearch
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmteam <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmteam
C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\workspaces\libnpmversion <===> C:\Dev\Programs\nvm\v18.13.0\node_modules\npm\node_modules\libnpmversion
DONE
*/
