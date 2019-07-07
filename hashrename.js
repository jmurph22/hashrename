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

//Global variable for recursion.
var recursive = false; //By default, we are not recursive.

function PrintHelp() {
	console.log("Usage: " + __filename + " [options] <dir(s)> <file(s)>\n"
		+ "	-R     | Recursively navigate directories.\n"
		+ "	--help | Print this help.\n\n"
		+ "Example: " + __filename + " /user/junk /mnt/stuff/things.txt\n");
	process.exit(-1);
}

if(process.argv.length <= 2) {
	PrintHelp();
}

function ProcessFile(full_file) {
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

		//Ensure we aren't trying to rename a file to itself.
		if(full_file != FullHashPath()) {
			fs.move(full_file, FullHashPath(), {clobber: true}, function (err2) {
				if(err2) { console.error(err2); }
							
				console.log('Successfully moved: ' + full_file + ' -> ' + FullHashPath());
			});
		}
	});
}

function ProcessPathArgs(current_path, basedir) {
	var IsRecursiveValid = () => {
		return(basedir || recursive);
	}

	//Function to check the details of the arguement provided
	fs.lstat(current_path).then(stats => {
		//Take this logic if the path is determined to be a file.
		if(stats.isFile()) {
			ProcessFile(current_path);
		}
		
		//Check if recursion is valid.
		else if(stats.isDirectory() && IsRecursiveValid()) {
			//Read file list into array.
			fs.readdir(current_path).then(files => {
				//Feed every file into the ProcessFile() function.
				files.forEach(file => {
					ProcessPathArgs(path.join(current_path,file),false);
				});
			}).catch(err => {
				console.error(err);
			});
		} else {
			console.error(current_path + ' is not a file or directory.');
		}
	}).catch(err => {
		console.error(err);
	});
}

function ProcessArgs() {
	var args = new Set(process.argv.slice(2));
	
	//If the help command was given at all, we just do help and quit.
	if(args.has('--help')) {
		PrintHelp();
	}

	//Set variable for dry run.
	if(args.has('-R')) {
		recursive = true;
		args.delete('-R')
	}

	args.forEach(current_arg => {
		ProcessPathArgs(path.resolve(current_arg),true);
	});
}

ProcessArgs();