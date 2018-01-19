/* MIT License
 *
 * Copyright (c) 2016 schreiben
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*eslint-env node, es6 */

{
    'use strict';

    const os = require('os'),
          path = require('path'),
          request = require('request'),
          zlib = require('zlib'),
          tar = require('tar-fs');

    const version = '8u162',
          build_number = '12',
          hash = '0da788060d494f5095bf8624735fa2f1';

    let arch = os.arch();
    switch (arch) {
        case 'x64':
            break;
        case 'x86':
        case 'ia32':
            arch = 'i586';
            break;
    }

    let platform = os.platform(),
        javaBinDir = 'bin';
    switch (platform) {
        case 'darwin':
            platform = 'macosx';
            javaBinDir = 'Contents/Home/bin';
            break;
        case 'win32':
            platform = 'windows';
            break;
        case 'linux':
            platform = 'linux';
            break;
    }

    const jreDir = path.join(__dirname, 'jre');

    const URL = `https://download.oracle.com/otn-pub/java/jdk/${version}-b${build_number}/${hash}/jre-${version}-${platform}-${arch}.tar.gz`;

    function install() {
        const options = {
            url: URL,
            rejectUnauthorized: false,
            agent: false,
            headers: {
                connection: 'keep-alive',
                'Cookie': 'gpw_e24=http://www.oracle.com/; oraclelicense=accept-securebackup-cookie'
            }
        };

        return new Promise((resolve, reject) => {
            request.get(options)
            .on('error', err => reject(err))
            .pipe(zlib.createUnzip())
            .pipe(tar.extract(jreDir, {
                map: header => {
                    header.name = header.name.replace(/.*?\//, '');
                    return header;
                },
                readable: true,
                writable: true
            }))
            .on('finish', () => resolve('JRE'));
        });
    }//install

    process.env.PATH += path.delimiter + path.join(jreDir, javaBinDir);
    exports.install = install;
}
