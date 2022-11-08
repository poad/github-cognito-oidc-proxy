#!/bin/sh

CUR=$(pwd)

CURRENT=$(cd "$(dirname "$0")" || exit;pwd)
echo "${CURRENT}"

cd "${CURRENT}" || exit
git pull --prune
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}" || exit
  exit $result
fi

cd "${CURRENT}"/package || exit
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}" || exit
  exit $result
fi
echo ""
pwd
yarn install && yarn upgrade && yarn build
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}" || exit
  exit $result
fi

cd "${CURRENT}"/example || exit
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}" || exit
  exit $result
fi
echo ""
pwd
yarn install && yarn upgrade
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}" || exit
  exit $result
fi

cd "${CURRENT}"/example/app || exit
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}" || exit
  exit $result
fi
echo ""
pwd
yarn install && yarn upgrade
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}" || exit
  exit $result
fi

cd "${CURRENT}" || exit
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}" || exit
  exit $result
fi
git commit -am "Bumps node modules" && git push
result=$?
if [ $result -ne 0 ]; then
  cd "${CUR}" || exit
  exit $result
fi

cd "${CUR}" || exit
