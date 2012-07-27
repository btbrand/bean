/*global bean:true, qwery:true, buster:true, Syn:true, assert:true, defer:true, features:true, globalSetUp:true, globalTearDown:true*/

buster.testCase('event object', {
    'setUp': globalSetUp
  , 'tearDown': globalTearDown

  , 'should have correct target': function (done) {
      var el1     = this.byId('foo')
        , el2     = this.byId('bar')
        , trigger = this.trigger()
        , spy     = this.spy()

      bean.add(el1, 'click', trigger.wrap(spy))

      Syn.click(el2)

      trigger.after(function() {
        assert(spy.calledOnce, 'called once')
        assert(spy.firstCall.args.length, 'has argument')
        assert.same(spy.firstCall.args[0].target, el2, 'event object has correct property')
        done()
      })
    }

  , 'event object': {
        'setUp': function () {
          var self = this
          this.runTest = function (custom, done, verifyFn) {
            var el      = self.byId('foo')
              , trigger = self.trigger()
              , spy     = self.spy()

            trigger.after(function() {
              assert(spy.calledOnce, 'called once')
              assert(spy.firstCall.args.length, 'has argument')
              verifyFn(spy.firstCall.args[0])
              done()
            })

            bean.add(el, custom ? 'customEvent' : 'click', trigger.wrap(spy))

            if (custom)
              bean.fire(el, 'customEvent')
            else
              Syn.click(el)
          }
        }

      , 'should have stopPropagation method': function (done) {
          this.runTest(false, done, function (event) {
            assert.isFunction(event.stopPropagation, 'event object has stopPropagation method')
          })
        }

      , 'should have preventDefault method': function (done) {
          this.runTest(false, done, function (event) {
            assert.isFunction(event.preventDefault, 'event object has preventDefault method')
          })
        }


      , 'should have stopPropagation method on custom event': function (done) {
          this.runTest(true, done, function (event) {
            assert.isFunction(event.stopPropagation, 'event object has stopPropagation method')
          })
        }

      , 'should have preventDefault method on custom event': function (done) {
          this.runTest(true, done, function (event) {
            assert.isFunction(event.preventDefault, 'event object has preventDefault method')
          })
        }
    }

  , 'stop()': {
        'setUp': function () {
          var self = this

          this.runTest = function (delegate, done) {
            // we should be able to prevent a keypress and event propagation with stop()
            // on the keypress event, checking the parent doesn't receive the keypress
            // and then checking the input contents on a keyup, it should be empty.
            var txt        = self.byId('txt')
              , parent     = self.byId('stopper')
              , fixture    = self.byId('fixtures')
              , trigger    = self.trigger()
              , parentSpy  = self.spy()
              , txtHandler = function (event) {
                  event.stop()
                }

            trigger.after(function () {
              refute(parentSpy.called, 'parent should not receive event')
              refute(txt.value.length, 'input is has no text after keypress')
              done()
            })

            txt.value = ''
            if (delegate) {
              bean.add(parent  , '*', 'keypress', trigger.wrap(txtHandler), qwery)
              bean.add(fixture      , 'keypress', trigger.wrap(parentSpy), qwery)
            } else {
              bean.add(txt   , 'keypress', trigger.wrap(txtHandler))
              bean.add(parent, 'keypress', trigger.wrap(parentSpy))
            }

            Syn.key(txt, 'f')
          }
        }

      , 'should preventDefault and stopPropagation': function(done) {
          this.runTest(false, done)
        }

      , 'should preventDefault and stopPropagation on delegated events': function (done) {
          this.runTest(true, done)
        }
    }

  , 'should have keyCode': function (done) {
      var el      = this.byId('input')
        , trigger = this.trigger()
        , spy     = this.spy()

      bean.add(el, 'keypress', trigger.wrap(spy))

      Syn.key(el, 'f')

      trigger.after(function() {
        assert(spy.calledOnce, 'called once')
        assert(spy.firstCall.args.length, 'has argument')
        assert(spy.firstCall.args[0].keyCode, 'event object has keyCode')
        done()
      })
    }

    // the idea here is that we have a whitelist in bean.js for properties to copy over from the original
    // event object (if they exist) to the new synthetic one. But, there are a bunch of browser specific
    // properties we don't care about. We list those properties here and then we check to see if there are
    // any properties in source event objects that aren't being copied to the new event objects that we
    // haven't specifically listed as 'ignorable'. This way we should be able to pick up new event properties
    // browsers as they're implemented and then make a decision as to whether they should be copied or not
  , 'event object properties': {
        'setUp': function () {
          var commonIgnorables = ('cancelBubble clipboardData defaultPrevented explicitOriginalTarget getPreventDefault initEvent initUIEvent isChar ' +
                'originalTarget preventCapture preventBubble rangeOffset rangeParent returnValue stopImmediatePropagation synthetic initPopStateEvent').split(' ')
              // stuff from IE8 and below
            , oldIEIgnorables = ('recordset altLeft repeat reason data behaviorCookie source contentOverflow behaviorPart url shiftLeft dataFld ' +
                'qualifier wheelDelta bookmarks srcFilter nextPage srcUrn origin boundElements propertyName ctrlLeft state').split(' ')
            , clickIgnorables = commonIgnorables.concat(oldIEIgnorables).concat(('charCode defaultPrevented initMouseEvent keyCode layerX layerY ' +
                'initNSMouseEvent x y state webkitMovementY webkitMovementX').split(' '))
            , oldIEKeyIgnorables = 'fromElement toElement dataTransfer button x y screenX screenY clientX clientY offsetX offsetY state'.split(' ')
            , keyIgnorables = commonIgnorables.concat(oldIEIgnorables).concat(oldIEKeyIgnorables).concat('initKeyEvent layerX layerY pageX pageY state'.split(' '))

            , el = this.byId('input')

            , getEventObject = function (evType, elType, trigger, callback) {
                var handler = function (e) {
                      bean.remove(el)
                      callback(e)
                    }
                el = elType === window ? elType : el;
                bean.add(el, evType, handler)
                trigger(el)
              }

            , contains = function (arr, e) {
                var i = arr.length
                while (i--) {
                  if (arr[i] === e) return true
                }
                return false
              }

            , verifyEventObject = function (event, type, ignorables) {
                var p, orig = event.originalEvent

                assert(event, 'has event object')
                assert(event.originalEvent, 'has reference to originalEvent')
                assert.equals(event.type, type, 'correct event type')

                for (p in orig) {
                  refute(
                         !event.hasOwnProperty(p)
                      && !contains(ignorables, p)
                      && !/^[A-Z_\d]+$/.test(p) // STUFF_LIKE_THIS
                      && !/^moz[A-Z]/.test(p) // Mozilla prefixed properties
                    , 'additional, uncopied property: "' + p + '" (may need to be added to event-object-test.js)'
                  )
                }
              }

          this.testMouseEvent = function (type, syn, done) {
            getEventObject(
                type
              , 'button'
              , function (el) { Syn[syn || type](el) }
              , function (event) {
                  verifyEventObject(event, type, clickIgnorables)
                  done()
                }
            )
          }

          this.testStateEvent = function (type, done) {
            if (!features.history) {
              assert(true, 'no history API in this browser, not testing state events')
              return done()
            }
            getEventObject(
                type
              , window
              , function (el) {
                  window.history.pushState({}, 'test state', '#test-state')
                  window.history.go(-1)
                }
              , function (event) {
                  try {
                    verifyEventObject(event, type, commonIgnorables)
                  } catch (e) { }
                  done()
                }
            )
          }

          this.testKeyEvent = function (type, done) {
            getEventObject(
                type
              , 'input'
              , function (el) { Syn.key(el, 'f') }
              , function (event) {
                  verifyEventObject(event, type, keyIgnorables)
                  done()
                }
            )
          }
        }

      , 'click: has correct properties': function (done) {
          this.testMouseEvent('click', null, done)
        }

      , 'dblclick: has correct properties': function (done) {
          this.testMouseEvent('dblclick', null, done)
        }

      , 'mousedown: has correct properties': function (done) {
          this.testMouseEvent('mousedown', 'click', done)
        }

      , 'mouseup: has correct properties': function (done) {
          this.testMouseEvent('mouseup', 'click', done)
        }

      , 'popstate: has correct properties': function(done) {
          this.testStateEvent('popstate', done)
        }

      , 'keyup: has correct properties': function (done) {
          this.testKeyEvent('keyup', done)
        }

      , 'keydown: has correct properties': function (done) {
          this.testKeyEvent('keydown', done)
        }

      , 'keypress: has correct properties': function (done) {
          this.testKeyEvent('keypress', done)
        }
    }
})