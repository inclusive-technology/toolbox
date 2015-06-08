#!/bin/sh

name=$1

echo "number of params $2"

for((i=0; i<$(($2+0)); i++))
do
  var1="$((i*2+3))"
  url=${!var1}
  var2="$((i*2+4))"
  password=${!var2}

  echo "url: $url | password: $password"

  ssh $url

done

dir
cd /D/sites/hkl-dev/activites"
dir