const Alexa = require("ask-sdk-core");
var axios = require("axios");

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    const speakOutput = "Welcome. You can say turn on bedroom light";
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.lastResult = speakOutput;
    handlerInput.attributesManager.setSessionAttributes(attributes);
    const repromptText = " for example, say turn off kitchen fan";
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptText)
      .getResponse();
  },
};

const getWish = () => {
  const mydate = new Date();
  let hours = mydate.getUTCHours();
  if (hours < 0) {
    hours = hours + 24;
  }
  if (hours < 12) {
    return "Good morning! ";
  } else if (hours < 18) {
    return "Good Afternoon! ";
  } else {
    return "Good evening! ";
  }
};

const getQuote = () => {
  const url =
    "http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json";
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((res) => res.data)
      .then((res) => {
        resolve(res.quoteText);
      })
      .catch((err) => {
        reject("", err);
      });
  });
};

const postRequest = (data) => {
  const url = "https://httpbin.org/post";
  return new Promise((resolve, reject) => {
    axios
      .get(url,data)
      .then((res) => res.form)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject("", err);
      });
  });
};

const HelloIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "HelloIntent"
    );
  },
  async handle(handlerInput) {
    const name =
      handlerInput.requestEnvelope.request.intent.slots.FirstName.value;
    const quote = await getQuote();
    let speakOutput = "hello " + name + ". " + getWish();
    speakOutput +=
      " quote for the day. " + quote + " Do you want to hear one more?";
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.lastResult = speakOutput;
    attributes.quoteIntent = true;
    handlerInput.attributesManager.setSessionAttributes(attributes);
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .withStandardCard(
        "quote",
        quote,
        "https://upload.wikimedia.org/wikipedia/commons/5/5b/Hello_smile.png"
      )
      .reprompt(
        "add a reprompt if you want to keep the session open for the user to respond"
      )
      .getResponse();
  },
};

const QuoteIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "QuoteIntent"
    );
  },
  async handle(handlerInput) {
    const quote = await getQuote();
    let speakOutput = "here. " + quote + "do you want to hear more?";
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.quoteIntent = true;
    attributes.lastResult = speakOutput;
    handlerInput.attributesManager.setSessionAttributes(attributes);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("You can say yes or one more. ")
      .getResponse();
  },
};

const NextQuoteIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "NextQuoteIntent"
    );
  },
  async handle(handlerInput) {
    let speakOutput = "";
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    if (attributes.quoteIntent) {
      const quote = await getQuote();
      speakOutput += quote + " do you want to hear more?";
      attributes.lastResult = speakOutput;
      handlerInput.attributesManager.setSessionAttributes(attributes);
    } else {
      speakOutput += "please try again.";
    }
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("You can say yes or one more. ")
      .getResponse();
  },
};

const SmartHomeIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "SmartHomeIntent"
    );
  },
  async handle(handlerInput) {
    let speakOutput = "";
    const intent = handlerInput.requestEnvelope.request.intent;
    const action = intent.slots.action.value;
    const location = intent.slots.location.value;
    const equipment = intent.slots.equipment.value;
    if (action && location && equipment) {
      let outputData = {
        action:action,
        location:location,
        equipment:equipment,
      };
      const response = await postRequest(outputData);
      speakOutput = `incomplete response ${response}`;
      if (response) {
        speakOutput = `Done ${response}`;
      }
    }

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("You want to perform any more steps?")
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = "You can say wish amy!";
    const repromptText = "How else can I help?";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptText)
      .getResponse();
  },
};

const RepeatIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.RepeatIntent"
    );
  },
  handle(handlerInput) {
    let speakOutput = "repeat!";
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    if (attributes.lastResult) {
      speakOutput = "I said: " + attributes.lastResult;
    }
    handlerInput.attributesManager.setSessionAttributes(attributes);
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speakOutput = "Okay, Goodbye!";

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = "Sorry, I don't know about that. Please try again.";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    console.log(
      `~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const speakOutput =
      "Sorry, I had trouble doing what you asked. Please try again.";
    console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    HelloIntentHandler,
    HelpIntentHandler,
    SmartHomeIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    QuoteIntentHandler,
    NextQuoteIntentHandler,
    RepeatIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent("sample/hello-world/v1.2")
  .lambda();
