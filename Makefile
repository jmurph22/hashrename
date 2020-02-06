all:
	g++ hashrename.cpp -std=c++17 -Os -lioapp -lssl -lcrypto -o hashrename
install:
	install -m 755 hashrename /usr/bin

uninstall:
	rm /usr/bin/hashrename

clean:
	rm *.o hashrename
