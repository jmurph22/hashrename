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

#include <iostream>
#include <filesystem>
#include <functional>
#include <cstring>
#include <cstdio>
#include <openssl/sha.h>
#include <libioapp.hpp>

//Globals
bool recursive = false;

std::string SHA256FromFile(const std::filesystem::path &p)
{
	const std::string &filename = p.string();

	unsigned char sh[SHA256_DIGEST_LENGTH];
	int bytes;
	FILE *shaFile = fopen (filename.c_str(), "rb");

	SHA256_CTX shContext;
	unsigned char data[1024];

	if(shaFile == NULL)
	{
		std::cerr << filename << " cannot be opened to hash." << std::endl;
		return "FAIL";
	}

	SHA256_Init(&shContext);

	while((bytes = fread(data, 1, 1024, shaFile)) != 0)
	{
		SHA256_Update(&shContext, data, bytes);
	}

	SHA256_Final(sh, &shContext);
	std::fclose(shaFile);

	char SHA256_return_string[65];
	for(int a = 0; a < SHA256_DIGEST_LENGTH; a++)
	{
		sprintf(SHA256_return_string + (a * 2), "%02x", sh[a]);
	}

	return SHA256_return_string;
}

int PrintHelp(void)
{
	std::cerr <<
	"Usage: hashrename [options] <dir(s)> <file(s)>\n" <<
	"	-R     | Recursively navigate directories.\n" <<
	"	--help | Print this help.\n\n" <<
	"Example: hashrename /user/junk /mnt/stuff/things.txt\n";
	return 1;
}

int main(int argc, char* argv[])
{
	ioapp::ProcessArgs hashrename_ProcessArgs(argc,argv,true,1);

	for(const std::string &f : hashrename_ProcessArgs.Flags)
	{
		if(f == "--help")
		{
			return PrintHelp();
		}

		if(f == "-R")
		{
			recursive = true;
		}
	}

	for(const std::string &arg : hashrename_ProcessArgs.Paths)
	{
		ioapp::ioapp(std::filesystem::path(arg), [&](std::filesystem::path p) {
			if(std::filesystem::is_regular_file(p))
			{
				std::string GetExt = "";
				if(p.has_extension())
				{
					GetExt = p.extension().string();
				}

				std::string new_file = p.parent_path().string() + '/' + SHA256FromFile(p) + p.extension().string();
				//We try two methos of moving a file, and crash if they fail.
				try
				{
					std::filesystem::rename(p, new_file);
				}

				catch(const std::exception& e)
				{
					try
					{
						std::filesystem::copy(p, new_file);
						std::filesystem::remove(p);
					}

					catch(const std::exception& ex)
					{
						std::cerr << ex.what() << '\n' << "Failed to move " << p.string() << std::endl;
						exit(1);
					}
				}

				std::cout << "Move: " << p.string() << " -> " << new_file << std::endl;
			}
			
			
		}, recursive);
	}

	return 0;
}