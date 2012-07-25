require('smoosh').config({
    'JAVASCRIPT': {
        'DIST_DIR': './'
      , 'bean': [
            './src/copyright.js'
          , './src/bean.js'
        ]
    }
  , "JSHINT_OPTS": {
        "predef": [ "assert", "refute", "define", "self" ]
      , "boss": true
      , "shadow": true
      , "trailing": true
      , "latedef": true
      , "forin": false
      , "curly": false
      , "debug": true
      , "devel": false
      , "evil": true
      , "regexp": false
      , "undef": true
      , "sub": true
      , "white": false
      , "indent": 2
      , "asi": true
      , "laxbreak": true
      , "eqnull": true
      , "browser": true
      , "node": true
      , "laxcomma": true
      , "proto": true
      , "expr": true
      , "es5": true
      , "strict": false
    }
}).run().build().analyze()
