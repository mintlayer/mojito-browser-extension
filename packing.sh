#!/bin/sh

# cleaning previous builds
rm -f ext.zip
rm -f extFF.zip 

# mode inside build dir
cd build

# creates zip for Firefox
mv manifestFirefox.json manifest.json
zip -r ../extFF.zip ./*
zip -d ../extFF.zip "manifestDefault.json"

# creates zip for non-Firefox browsers
rm -f manifest.json
mv manifestDefault.json manifest.json
zip -r ../ext.zip ./*
