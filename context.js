var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var sunEndpointHeader = "https://api.sunrise-sunset.org/json?lat="
var geoEndpointHeader = "http://maps.googleapis.com/maps/api/geocode/json?address="
var timezoneEndpointHeader = "https://maps.googleapis.com/maps/api/timezone/json?location="
var timezoneEndpointFooter = "&timestamp=1331161200&key=%20AIzaSyDRjUDsuL7qn1eVIY2o831XDV7G0vYQuls"
var conversionEndpointHeader = "http://api.timezonedb.com/v2/convert-time-zone?key=U89UI3AQNCMP&format=json&from=GMT&to="


//set values
var lat;
var lng;
var timezone;
var sunsetTimestamp;
var sunriseTimestamp;
var sunsetTime;
var sunriseTime;

const varsToUpdateBeforeWatson = {
  /*variableName: {
    value: false OR value, //Set a particular value on every call, set to false to ignore this field.
    forceIfUndefined: true, //If the context variable does not exist yet, tells if it should be created
    function: function(answerText, context, key) { //Different sets of actions depending on the answerText, can access the whole context, must not update context. @return the new context[key] value.
      return new_context[key]_value;
    }
  }*/
};
const varsToUpdateAfterWatson = {
  latitude: {
    value: false, //Set a particular value on every call, set to false to ignore this field.
    forceIfUndefined: true, //If the context variable does not exist yet, tells if it should be created
    function: function(answerText, context, key) { //Different sets of actions depending on the answerText, can access the whole context, must not update context. @return the new context[key] value.
      var returnValue = 0;
      if ((answerText[0].indexOf("Let me check")!=-1)) {
        console.log("API call ahead")
        var http = new XMLHttpRequest();
        http.open('GET', geoEndpointHeader + context["location"], false);
        http.send(null);
        if (http.status === 200) {
          var resp = JSON.parse(http.responseText)
          returnValue = resp.results[0].geometry.location.lat;
          lng = resp.results[0].geometry.location.lng;
          lat = returnValue;
          console.log("GOT latitude: " + returnValue)
        }
      } else if (context[key] !== returnValue) {
        returnValue = context[key];
      }
      return returnValue;
    }
  },
  longitude: {
    value: false, //Set a particular value on every call, set to false to ignore this field.
    forceIfUndefined: true, //If the context variable does not exist yet, tells if it should be created
    function: function(answerText, context, key) { //Different sets of actions depending on the answerText, can access the whole context, must not update context. @return the new context[key] value.
      var returnValue = 0;
      if ((answerText[0].indexOf("Let me check")!=-1)) {
        returnValue = lng;
        console.log("GOT longitude: " + returnValue)
      } else if (context[key] !== returnValue) {
        returnValue = context[key];
      }
      return returnValue;
    }
  },
  timezone: {
    value: false, //Set a particular value on every call, set to false to ignore this field.
    forceIfUndefined: true, //If the context variable does not exist yet, tells if it should be created
    function: function(answerText, context, key) { //Different sets of actions depending on the answerText, can access the whole context, must not update context. @return the new context[key] value.
      if ((answerText[0].indexOf("Let me check")!=-1)) {
        console.log("API call ahead")
        var http = new XMLHttpRequest();
        http.open('GET', timezoneEndpointHeader + lat + "," + lng + timezoneEndpointFooter, false);
        http.send(null);
        if (http.status === 200) {
          var resp = JSON.parse(http.responseText)
          timezone = resp.timeZoneId
          console.log("GOT timezone: " + timezone)
        }
      } else if (context[key] !== timezone) {
        timezone = context[key];
      }
      return timezone;
    }
  },
  sunset: {
    value: false, //Set a particular value on every call, set to false to ignore this field.
    forceIfUndefined: true, //If the context variable does not exist yet, tells if it should be created
    function: function(answerText, context, key) { //Different sets of actions depending on the answerText, can access the whole context, must not update context. @return the new context[key] value.
      if ((answerText[0].indexOf("Let me check")!=-1)) {
        console.log("API call ahead")
        var http = new XMLHttpRequest();
        http.open('GET', sunEndpointHeader + lat + "&lng=" + lng + "&date=" + context["date"], false);
        http.send(null);
        if (http.status === 200) {
          var resp = JSON.parse(http.responseText)
          sunsetTime = resp.results.sunset
          sunriseTime = resp.results.sunrise
          sunsetTime = convertTime(sunsetTime);
          console.log("Got actual sunset time: " + sunsetTime)
        }
      } else if (context[key] !== sunsetTime) {
        sunsetTime = context[key];
      }
      return sunsetTime;
    }
  },
  sunrise: {
    value: false, //Set a particular value on every call, set to false to ignore this field.
    forceIfUndefined: true, //If the context variable does not exist yet, tells if it should be created
    function: function(answerText, context, key) { //Different sets of actions depending on the answerText, can access the whole context, must not update context. @return the new context[key] value.
      var returnValue = 0;
      if ((answerText[0].indexOf("Let me check")!=-1)) {
        sunriseTime = convertTime(sunriseTime)
        console.log("Got actual sunrise time: " + sunriseTime)
      } else if (context[key] !== sunriseTime) {
        sunriseTime = context[key];
      }
      return sunriseTime;
    }
  }
};

function convertTime(time) {
  var seconds;
  if (time.indexOf("PM")!=-1)
  {
    time = time.substring(0,time.length-3)
    var temp = time.split(':')
    if (temp[0]==12){
      seconds = (+temp[0]) * 60 * 60 + (+temp[1]) * 60 + (+temp[2]);
    }
    else {
      temp[0] = 12 + parseInt(temp[0])
      seconds = (+(temp[0])) * 60 * 60 + (+temp[1]) * 60 + (+temp[2]);
    }
  }
  else if (time.indexOf("AM")!=-1)
  {
    time = time.substring(0,sunsetTime.length-3)
    var temp = time.split(':')
    if (temp[0]==12) {
      seconds = (+0) * 60 * 60 + (+temp[1]) * 60 + (+temp[2]);
    }
    else {
      seconds = (+temp[0]) * 60 * 60 + (+temp[1]) * 60 + (+temp[2]);
    }
  }
  console.log("API call ahead")
  var http = new XMLHttpRequest();
  // console.log(conversionEndpointHeader + timezone + "&time=" + seconds)
  http.open('GET', conversionEndpointHeader + timezone + "&time=" + seconds, false);
  http.send(null);
  if (http.status === 200) {
    var resp = JSON.parse(http.responseText)
    console.log(resp.toTimestamp);
    time = resp.toTimestamp
    console.log("GOT fixed time: " + time)
  }
  time = new Date(time * 1000).toISOString().substr(11, 8);
  return time;
}

module.exports = {
  /**
   * Returns context before it's sent to Watson Conversation API.
   * The rules to update variables are in the static array varsToUpdateBeforeWatson.
   * @param   {Object}    inMemoryContext     current context
   * @param   {string}    messageText         user text message
   * @return  {Object}                        modified context
   */
  setContextToWatson: function(inMemoryContext, messageText) {
    if (Object.keys(varsToUpdateBeforeWatson).length !== 0) {
      for (key in varsToUpdateBeforeWatson) {
        var currentUpdate = varsToUpdateBeforeWatson[key];
        if (typeof inMemoryContext[key] !== 'undefined' || currentUpdate.forceIfUndefined) {
          if (currentUpdate.value !== false && currentUpdate.value !==
            inMemoryContext[key]) {
            inMemoryContext[key] = currentUpdate.value;
          } else if (currentUpdate.function !== false) {
            inMemoryContext[key] = currentUpdate.function(messageText,
              inMemoryContext, key);
          }
        }
      }
    }
    return inMemoryContext;
  },
  /**
   * Updates context after it has been returned from Watson Conversation API.
   * The rules to update variables are in the static array varsToUpdateAfterWatson.
   * @param   {Object}    watsonUpdate        return from Watson Conversation API which contains output, context, and all sorts of data.
   */
  setContextAfterWatson: function(watsonUpdate) {
    if (Object.keys(varsToUpdateAfterWatson).length !== 0) {
      console.log("UPDATE variables")
      for (key in varsToUpdateAfterWatson) {
        var currentUpdate = varsToUpdateAfterWatson[key];
        if (watsonUpdate.context && typeof watsonUpdate.context[key] !== 'undefined' ||
          currentUpdate.forceIfUndefined) {
          if (currentUpdate.value !== false && currentUpdate.value !==
            watsonUpdate.context[key]) {
            watsonUpdate.context[key] = currentUpdate.value;
          } else if (currentUpdate.function !== false) {
            watsonUpdate.context[key] = currentUpdate.function(watsonUpdate
              .output.text, watsonUpdate.context, key);
          }
        }
      }
    }
    //Send results
    if ((watsonUpdate.output.text[0].indexOf("Let me check")!=-1) && watsonUpdate.context["param"]=="sunset"){
      watsonUpdate.output.text[watsonUpdate.output.text.length+1] = "The sunset time in " + watsonUpdate.context["location"] + " on " + watsonUpdate.context["date"] + " is " + watsonUpdate.context["sunset"] + ", " + watsonUpdate.context["timezone"] + " time."
    }
    if (watsonUpdate.output.text[0].indexOf("Let me check")!=-1 && watsonUpdate.context["param"]=="sunrise"){
      watsonUpdate.output.text[watsonUpdate.output.text.length+1] = "The sunrise time in " + watsonUpdate.context["location"] + " on " + watsonUpdate.context["date"] + " is " + watsonUpdate.context["sunrise"] + ", " + watsonUpdate.context["timezone"] + " time."
    }
    //Send results
  }
}
