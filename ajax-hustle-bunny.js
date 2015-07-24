/*
 * Project: Ajax Hustle Bunny
 *
 * Purpose: Ajax Hustle Bunny handles the hopping around from view to view using Ajax. It gives able apps
 *          the ajax ability to handle history. Ajax Hustle Bunny also makes sure that events can be handled
 *          throughout both Ajax and non-ajax switching of views and that it can do so without causing memory
 *          issues caused by listening for events on elements that have been removed from the page flow or
 *          from stacking identical events on top of elements which can occur on some SPA's when navigation
 *          to one page reoccurs.
 * Author: Michael Rosata @ TqSoft
 *
 * License: MIT 2015 created by Michael Rosata. mrosata1984@gmail.com
 *
 * Instructions:
 *
 *      --- To make a link use Ajax, simply add the 'ahb-click' class and data-ahb-action attribute
 *
 *        ex: <a href="#" class="ahb-click" data-ahb-action="/rabbit/hole">Hop-Hop!</a>
 *            this will load into the main container www.example.com/rabbit/hole
 *            and it will inform any subscribers to the fact that the view has been changed so that your
 *            class/objects can react/behave appropriately.
 *
 *      --- To subscribe to ajax events made by the AjaxHustleBunny use the ajaxEvents subscribe method.
 *
 *        ex: ajaxHustleBunny.ajaxEvents.subscribe('any-handle', myObject.myHandler);
 *            now, when a new view is loaded, myObject will have the chance to take any action needed
 *            based on the "endpoint", the endpoint for /rabbit/hole = "rabbit/hole". So that would be
 *            the argument passed to myObject.myHandler after ajax events.
 *
 *      ---- To when/did
 *           //Todo: Explain the when/did subscription handler. It's basically a spring loaded event. Once the spring pops anyone can clearly see that yes it did occur, but it can't be listened to twice. It is extremely useful in handling load order throughout applications that may load many scripts from various domains. The scripts may not always load in the same order but you want to start each event as soon as possible. So this pattern will allow for your setup functions to fire when loaded and declare dependancies. If the dependancies have been met already then it will be told that. If not then it can set a callback to fire when dependancies are met. I like to think of this pattern as a dominoe effect.
 *
 *      //TODO: Might be good to have an event that fires before the ajax request is made. However since there is no need for it yet, I'm not going to create more noise.
 */

var ajaxHustleBunny = (function($, window, undefined) {

  // Sometimes certain pages need body classes. If that's the case, map the $action to the class
  var bodyClassMap = {
    'complaints/index' : 'controls'
  };

  function filterEndpoint(endpoint, action) {
    if (/^\/[^/]+\/?$/.test(endpoint)) {
      endpoint = endpoint.replace(/(^\/[^/]+)\/?$/, '$1/index');
    }
    if (/^\/[^/]+\/[^/]+\/[^/]+\/?$/.test(endpoint)) {
      endpoint = endpoint.replace(/^(\/[^/]+\/[^/]+)(\/[0-9]+\/?)$/, '$1');
    }
    if (endpoint.length && endpoint[0] == '/')
      endpoint = endpoint.substr(1);
    // Don't want id on endpoint IE: controller/action/id <--- remove /id
    var ep1 = endpoint.split('/')[0] || '';
    var ep2 = endpoint.split('/')[1] || '';
    endpoint = ep1 + '/' + ep2;
    return endpoint;
  }


  /**
   * return the action from a url endpoint
   * @param endpoint
   * @return string|integer - empty string or action if exists.
   */
  function filterAction(endpoint) {
    var action = '';
    if (/^\/?[^/]+\/[^/]+\/[^/]+\/?$/.test(endpoint)) {
      action = endpoint.replace(/^\/[^/]+\/[^/]+\/([0-9]+)\/?$/, '$1');
    }
    return parseInt(action, 10);
  }

  /**
   * AjaxHustleBunny Public API
   */
  return {
    setUp: false, // whether we've setup initial pushstate.
    container: '.mainCont',
    updateState: false,
    stateObject : {url: 'index', title: ''},
    onHopState: function(event) {
      if (event && event.state) {
        ajaxHustleBunny.stateObject.url = event.state.url;
        ajaxHustleBunny.updateUrl = false;
        ajaxHustleBunny.getPage();
      }
    },

    /**
     * Change Page With Ajax (NEW! 07-13-2015)
     *
     * This used to only be available through clicks via .ahb-click event. I moved it out here because it isn't a good
     * idea to have to try to figure out this stuff in multiple places. So now we can call our own view loading url
     * without a user click (if we need) and it will behave identical to an ahb-click event
     *
     * @param pathname - full enpoint and action /something/something/3 or /something/thing
     */
    hopHere: function(pathname) {
      ajaxHustleBunny.updateState = true;
      ajaxHustleBunny.stateObject.url = pathname;
      ajaxHustleBunny.getPage(pathname);
    },

    /**
     * Create click handler for ahb-click links
     */
    setupClicks: function () {
      $(document).on('click.abh.click', '.ahb-click', function (e) {
        // Get information needed to make the ajax transaction a success
        var endpoint = $(this).data('ahb-action');
        // Call the method to change page and take appropriate view loading actions
        ajaxHustleBunny.hopHere(endpoint);
        // So links won't leave hashtag in navigation bar
        return false;
      });
    },


    /**
     * This determines if state needs to be updated or not and then does it.
     * Makes it simple to not have to do the check from 100 other places. If in doubt,
     * just pass the endpoint into this method from anywhere in program and AjaxHustleBunny
     * will figure it out.
     *
     * @param string endpoint
     * @param bool force - whether to update state regardless.
     */
    handleStateUpdate: function(endpoint, force) {
      if (window && window.history) {
        if (ajaxHustleBunny.updateState || !!force) {
          window.history.pushState(ajaxHustleBunny.stateObject, '', endpoint);
          ajaxHustleBunny.updateState = false;
        }
      }
    },


    /**
     * Load the page/partial into the view using Ajax if the History API is available
     * @param endpoint
     */
    getPage: function(endpoint) {
      endpoint = endpoint || ajaxHustleBunny.stateObject.url;
      var action = '';

      // If there is no endpoint, then we can't do anything really.
      if (endpoint == '')
        return false;

      var loadingArea = $(ajaxHustleBunny.container);
      // Check if we have access to the pushState API
      if (!!window.history && 'pushState' in window.history) {
        $.ajax(endpoint, {
          type: 'post',
          dataType: 'html',
          data: {cp_action: 'ajax'},
          url: endpoint,
          success: function (res) {
            if (loadingArea.length) {
              loadingArea.html(res);
            }

            // Check if we need to push an updated state object into History
            ajaxHustleBunny.handleStateUpdate(endpoint);


            if (endpoint.match(/[^/]+\/[^/]+\/[^/]\/?$/)) {
              action = endpoint.replace(/[^/]+\/[^/]+\/([^/]+)\/?$/, "$1");

            }

            actionValue = filterAction(endpoint);
            endpoint = filterEndpoint(endpoint);
            // Take care of controller-action specific JavaScript
            ajaxHustleBunny.fireOffEndpointAction(endpoint, actionValue);
          }
        });
      }
      // ELSE -- We don't have access to pushState, so just load new page
      else {
        window.location = endpoint;
      }

    },

    /**
     * Store function references to cleanups that should be ran when views change
     */
    cleanUp: [],
    /**
     * If any views have actions that should be fired along with them, or cleanup that has to be fired
     * when the page navigates off of them, this is where that is done. It is called automatically so there
     * is no need to call on your own. (it calls on any page load or ajax load)
     * @param endpoint
     */
    fireOffEndpointAction: function(endpoint, actionValue) {
      var historyEndpoint = endpoint;
      actionValue = actionValue || filterAction(endpoint);;
      if (/^\/[^/]+\/?$/.test(endpoint)) {
        endpoint = endpoint.replace(/(^\/[^/]+)\/?$/, '$1/index');
        historyEndpoint = endpoint;
      }

      console.log('Ajax Endpoint Event:: %s  @ fireOffEndpointAction()', endpoint);
      // One of the first things to do is reset any actions that may or may not have happened. We have a bunny array for this!
      if (ajaxHustleBunny.cleanUp.length > 0) {
        var len = ajaxHustleBunny.cleanUp.length,
            i = 0, cleanupFn;

        for (i; i < len; i++) {
          // Try to perform whatever clean up has been asked of us by views
          try {
            cleanupFn = ajaxHustleBunny.cleanUp[i]();
          } catch(e) {}
        }
        // reset the array!
        ajaxHustleBunny.cleanUp = [];
      }


      if (!ajaxHustleBunny.setUp && window && window.history) {
        // This only fires 1 time, it sets the initial state so we can back button to it.
        if (historyEndpoint.substring(0,1) != '/')
          storedEnpoint = '/' + historyEndpoint;
        ajaxHustleBunny.stateObject.url = historyEndpoint;
        window.history.pushState(ajaxHustleBunny.stateObject, '', historyEndpoint);
      }
      ajaxHustleBunny.setUp = true;

      // Now the real work TODO: Check why I took time to remove that leading '/'
      endpoint = filterEndpoint(endpoint);

      if (bodyClassMap.hasOwnProperty(endpoint)) {
        $('body').removeClass().addClass(bodyClassMap[endpoint]);
      }


      /*-
       -- This used to check if there was as method called 'endpoint' and then fire it. Then that would play out any
       -- code that needed to be ran upon that view change or action by any Aroma js stuff running. It' getting heavy
       -- where ajaxHustleBunny is doing a lot of Aroma stuff... not what it was originally intended to do. So, now we
       -- don't check if ajaxEvents.hasOwnProperty(endpoint), just pass any endpoint to ajaxEvents.publish() and it can
       -- send it out to subscribers and let them figure out what to do. This will cut back on tons of repeated code.
       */
      ajaxHustleBunny.ajaxEvents.publish(endpoint, actionValue);

      return false;

    },

    /**
     * After certain parts of the page load, they may need some special actions to be taken. If so, that is what
     * these methods are for.
     * TODO: Find better way to fire off these - maybe the jQuery Ajax Events! (note: this way isn't bad now)
     */
    ajaxEvents: {
      /**
       * This isn't a typical PubSub, it's not a hub to allow objects to listen to each other, it only is a notifier of
       * endpoints or actions fired off from ajax. To subscribe just pass method to call as arg from outside to
       * ajaxHustleBunny.ajaxEvents.subscribe( method ).
       * @param object       - The object of which the method belongs to.
       * @param notifyMethod - function/method to call with name of any endpoint fired
       */
      subscribe: function(pubName, notifyMethod) {
        var subs;
        if (!this.subscribers) {
          this.subscribers = {};
        }
        subs = this.subscribers;
        if (subs.hasOwnProperty(pubName)) {
          throw new Error("The publish event named " + pubName + " has already been subscribed to ajaxHustleBunny.ajaxEvents with method: " + subs[pubName]);
        } else {
          if (!!notifyMethod)
            subs[pubName] = notifyMethod;
        }
      },

      /**
       * Publish out endpoints after firing any endpoint method inside house first (ajaxHustleBunny)
       * @param endpoint
       */
      publish: function(endpoint, action) {
        // set the globals (these are going to be handy for initial page load handlers) 07/15/2015
        this.currentEndpoint = endpoint;
        this.currentAction = action;

        if (this.hasOwnProperty(endpoint)) {
          // fire off anything specific to endpoint in this object
          this[endpoint]();
        }

        var subs = this.subscribers,
            pubName;
        for (pubName in subs) {
          if (subs.hasOwnProperty(pubName) && $.isFunction(subs[pubName])) {
            subs[pubName](endpoint, action);
          }
        }

      },

      // Things that have been finished.
      finished: [],
      // Methods waiting for things to finish.
      waiting: {},

      did: function(what) {
        if (this.finished.indexOf(what) == -1) {
          // Add 'what' was done to list if not there already
          this.finished.push(what);
        }
        if (this.waiting.hasOwnProperty(what)) {
          var waitingList = this.waiting[what],
              i = waitingList.length;
          while (i) {
            i--;
            if ($.isFunction(waitingList[i])) {
              // execute the function
              waitingList[i](what);
            }
            // We're iterating down so we can just POP! off.
            waitingList.pop();
          }
        }
      },

      when: function(what, tell) {
        if (this.finished.indexOf(what) > -1 && $.isFunction(tell)) {
          // If the 'what' has already happened, then tell the 'tell'
          tell(what);
        } else {
          if (!this.waiting.hasOwnProperty(what)) {
            // If we don't have waiting list for this 'what', then start one!
            this.waiting[what] = [];
          }
          this.waiting[what].push(tell);
        }
      }

    } // End ahb.ajaxEvents

  }; // End Return API

}(jQuery,window));
