elasticio-helloworld
====================

[![Build Status](https://travis-ci.org/hajoeichler/elasticio-helloworld.png?branch=master)](https://travis-ci.org/hajoeichler/elasticio-helloworld)


## How to develop

Install the required dependencies

```bash
npm install
```

Source files are written in `coffeescript`. Use [Grunt](http://gruntjs.com/) to build them

```bash
grunt
```

This will generate source files into `./app` folder.

Make sure to setup the correct environment for `elasticio` integration

```bash
echo '{}' > ${HOME}/elastic.json && touch ${HOME}/.env
```

### Specs

Specs are located under `./spec` folder and written as [Jasmine test](http://pivotal.github.io/jasmine/).

To run them simply execute

```bash
jasmine-node --captureExceptions --coffee spec
```

or

```bash
npm test
```

which will also execute `elasticio`