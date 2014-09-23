jshint src/**/*.js
mkdir -p tmp
mv -t tmp site/api/LICENSE
mv -t tmp site/api/README.md
mv -t tmp/ site/api/.git
yuidoc -q --themedir apitheme
mv -t site/api/ tmp/*
mv -t  site/api/ tmp/.git
rmdir tmp
browserify -r ./src/parcela:parcela -u fake-dom -u jsdom > ./site/dist/parcela.js
uglifyjs ./site/dist/parcela.js -c drop_debugger,drop_console,warnings=false -m >./site/dist/parcela-min.js
jekyll build
