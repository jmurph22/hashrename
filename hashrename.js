#!/usr/bin/env node

/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var fs = require('fs-extra'); //https://www.npmjs.com/package/node-fs-extra
var path = require('path');
var crypto = require('crypto')

function PrintHelp() {
	console.log("Usage: " + __filename + " [options] <files or directories>\n"
		+ "	--help | Print this help.\n\n"
		+ "Example: " + __filename + " /user/junk /mnt/stuff/things.txt\n");
	process.exit(-1);
}

if(process.argv.length <= 2) {
	PrintHelp();
}

var args = process.argv.slice(2);

function ProcessFile(full_file) {
	//Function to check the details of the path fed to ProcessFile().
	fs.lstat(full_file, (err, stats) => {
		//Print the error message to stderror.
		if(err) { console.error(err); }
		
		//Take this logic if the path is determined to be a file.
		if(stats.isFile()) {
			//Read the file and compute a hash.
			fs.createReadStream(full_file).pipe(crypto.createHash('sha256').setEncoding('hex')).on('finish', function () {
				var local_hash = this.read();
				var BaseFileName = path.basename(full_file); //Basename

				//Function to create our hashed path to move as a single variable.
				var FullHashPath = () => {
					//We consider everything past the first dot to be an extension.
					var GetFirstDot = (local_index) => {
						return BaseFileName.slice(local_index);
					}
					
					/*
					Parts:
					- Fully resolved dir name
					- Hash
					- Ext of the original filename.
					*/
					
					return path.join(path.resolve(path.dirname(full_file)), local_hash +  GetFirstDot(BaseFileName.indexOf('.')));
				}

				fs.move(full_file, FullHashPath(), {clobber: true}, function (err2) {
					if(err2) { console.error(err2); }
								
					console.log('Successfully moved: ' + full_file + ' -> ' + FullHashPath());
				});
			});
		} else if(stats.isDirectory()) {
			fs.readdir(full_file, (err2, files) => {
				files.forEach(file => {
					ProcessFile(path.resolve(full_file) + '/' + file);
				});
			});
		} else {
			console.error(full_file + ' is not a file or directory.');
		}
	});
}

args.forEach(current_path => {
	ProcessFile(current_path);
});
