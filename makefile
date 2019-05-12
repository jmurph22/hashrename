install:
	install -m 755 hashrename.js /usr/bin
	npm install -g fs-extra
uninstall:
	rm /usr/bin/hashrename.js
