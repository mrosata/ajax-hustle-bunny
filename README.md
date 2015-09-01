Ajax Hustle Bunny
===================
#### <i class="icon-file"></i> Instructions, getting started, "Hop to it!"

Please bear in mind this tool is in beta. I would only suggest using it if you also may want to contribute to it. It's a simple module for handling ajax view changes and ajax related events throughout a web application. It implements history in supported browsers, loads views, notifies all view modules through callbacks on every view change and manages a global event system name `did / when / after` which uses similar terms as, but does not implement (as of yet), promises. I will be updating this as I am currently using it in a large application. The application is going through beta now, so I'll be able to keep up on changes (hopefully).

 --- To make a link use Ajax, simply add inline html `class="ahb-click"` and attribute `data-ahb-action="/some/module"`.
 > ex: `<a href="#" class="ahb-click" data-ahb-action="/rabbit/hole">Hop-Hop!</a>`
> Here's what is happening, the `ahb-click` class name is telling ajax-hustle-bunny that is should listen to this element for a click and when it is clicked it is ran through Ajax Hustle Bunny and checked for data actions such as `data-ahb-action` which changes the main view to `/rabbit/hole` and it will inform any subscribers to the fact that the view has been changed so that your independant classes/modules/objects can react/behave appropriately.
>  NOTE: In future versions of AHB, this may change. I'm really trying to separate all JavaScript from touching any css classes. Too much trouble. Most likely the bunny will use another data=* attribute or nothing. As it stands `data-ahb-action="..` should be good enough for the event handler. That's the future though.

--- To subscribe to ajax events handled through the Ajax Hustle Bunny you may use the `ajaxEvents` subscription handler.
> `ajaxHustleBunny.ajaxEvents.subscribe('some-handle', someObject.someHandlerFn);`
> Now when a new view is loaded, `someObject` will have the chance to take action based on the "endpoint", the endpoint for `/rabbit/hole` is `"rabbit/hole"`. Ajax Hustle Bunny works using a MVC url structure assumption. So the rabbit calls "model/view" an endpoint and anything after that is called the "action" which is passed as the second argument to any subscriber upon page changes.
>
> **You can handle page changes within a module easily like so:**
```js
var forumModule = (function (window, undefined) {
  // private variable to hold actions specific to my module.
  var postID;

  /* Setup, 1 time for entire application. */
  function init () {
  // Subscribe to be notified of ALL Ajax Hustle Bunny view changes
    ajaxHustleBunny
      .ajaxEvents
      .subscribe('forum-view', forumModule.ajaxHustleHandler);
  }

  /* Every View Change, this is called by AjaxHustleBunny */
  function ajaxHustleHandler (endpoint, action) {
    // The endpoint can be used to
 	switch (endpoint) {
	  case 'forum/view':
	    displayPostDetails(action);
	  case 'forum/reply':
	    // Set the private var postID so other module methods may access it.
	    postID = parseInt(action, 10);
	    break;
	  default:
	    // This is some other modules endpoint, the url "action" isn't a postID
	    postID = null;
    }
  }

  /* Public API */
  return {
	init: init
  };
}(window));


// This line could be called from elsewhere in a main module perhaps.
forumModule.init();
```

 * TODO: Explain the **did / when / after** subscription handler. It's basically a spring loaded event system that allows ordering through all modules without coupling. It's not based on promises, there are no return values. When a module does something significant or important to another module, you could decide to make that known to Ajax Hustle Bunny through `ahb.ajaxEvents.did('something-awesome')` and then if another module had a dependant action it could call `ahb.ajaxEvents.when('something-awesome', callback)` or `ahb.ajaxEvents.after('something-awesome', callback)` .
 * The difference between `when` and `after` is that `when` can occur repeatily. For example you might have your forum module fire a `did` notification so every-time a reply is made another module listening with the `when` method could reload its content. The `after` method is more for initial setup of the application, so that events across all files can fire in the proper order either to prevent breakage to enhance perceived performance in regards to html content.

---
> * TODO: Might be good to have an event that fires before the ajax request is made and also to actually implement promises in the Ajax Hustle Bunny `ajaxEvents` object. If promises are added it should be in a way that makes them simple for unfamiliar users or the promises could just wrap the did / when / after and hold onto resolved promises so that if a module calls `after` on an event that has already occurred it may still have access to the resolution provided by that promise.
