//------------------
//Custom Event Handler
//------------------
//https://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/
//Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
//Modified by jhonsore
//MIT License
function CustomEventHandler(){
    this._listeners = {};
}

CustomEventHandler.prototype = {

    constructor: CustomEventHandler,

    addListener: function(type, listener){
        if (typeof this._listeners[type] == "undefined"){
            this._listeners[type] = [];
        }
        this._listeners[type].push(listener);
    },

    /*
     ** added __args to receive some params on object dispatch (jhonsore)

     var obj = {item:this.args,teste:10};
     this.dispatchEvent("foo",obj);
     __args will receive var obj created before
     */
    dispatchEvent: function(event,__args){
        if (typeof event == "string"){
            event = { type: event, customEventData: __args};
        }
        if (!event.target){
            event.target = this;
        }

        if (!event.type){  //falsy
            throw new Error("Event object missing 'type' property.");
        }

        if (this._listeners[event.type] instanceof Array){
            var listeners = this._listeners[event.type];
            for (var i=0, len=listeners.length; i < len; i++){
                listeners[i].call(this, event);
            }
        }
    },

    removeListener: function(type, listener){
        if (this._listeners[type] instanceof Array){
            var listeners = this._listeners[type];
            for (var i=0, len=listeners.length; i < len; i++){
                if (listeners[i] === listener){
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    }
};