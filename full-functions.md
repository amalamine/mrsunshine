# Context (context.js)

You can find 2 arrays in **context.js** :
+ varsToUpdateBeforeWatson
+ varsToUpdateAfterWatson

Both work the same way, but obviously, one is used before Watson Conversation gets the message, and one occurs after it answered.

*Here is an example of entry in varsToUpdateAfterWatson. It is used to generate an order number for the user after Watson said a certain text. The function has access to the whole context, and will return the new value of context[key] (so if the text you're looking for isn't present, just return the current value)*
```javascript
orderNumber: {
  value: false,
  forceIfUndefined: true,
  function: function(message, context, key) {
    var returnValue = 0;
    if(message.indexOf('Everything is ready for me, what about you ?') !== -1) {
      //Here is the actual important part. That's where you want to fetch certain data/values from third-party APIs eventually.
      returnValue = Math.floor(Math.random() * 175000 + 100000);
    }
    else if(context[key] !== returnValue) {
      returnValue = context[key];
    }
    return returnValue;
  }
}
```
*Note that you can make much more complex conditions depending on many factors from context for example.*

The value field is there to make sure a certain variable is always the same.
Set forceIfUndefined to true to force the creation of the variable in Context if nonexistent.

**Caution** :
+ in *varsToUpdateBeforeWatson*, the message in the function is from **user**.
+ in *varsToUpdateAfterWatson*, the message in the function is from **Watson**.
