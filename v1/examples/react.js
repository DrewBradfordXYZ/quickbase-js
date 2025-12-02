import React, { useState, useEffect } from "react";
import { quickbase } from "quickbase-js";

const App = () => {
  const [appName, setAppName] = useState < string > "Loading...";
  const [error, setError] = (useState < string) | (null > null);

  useEffect(() => {
    // Initialize the QuickBase client
    const qb = quickbase({
      realm: "your-realm", // Replace with actual QuickBase realm
      // ## ------------------------------
      // ## Authentication Options
      // ## ------------------------------
      // ## OPTION 1: User Token Authentication
      // ## - Use this if you have a QuickBase user token (get it from "My Profile" > "Manage User Tokens")
      // ## - Works in Node.js or browsers, ideal for standalone apps or testing outside QuickBase
      // ## - Use the line below and replace with your token; comment out 'useTempTokens'
      // userToken: "your-user-token",

      // ## ------------------------------
      // ## OPTION 2: Temporary Token Authentication
      // ## - Use this for QuickBase code pages, leveraging the browser’s authenticated session
      // ## - No user token needed; requires running in a QuickBase browser context
      // ## - Uncomment the line below and comment out 'userToken' if using this option
      // useTempTokens: true,
    });

    // Fetch the app
    qb.getApp({ appId: "your-app-id" }) // Replace with actual app ID
      .then((app) => {
        setAppName(app.name);
      })
      .catch((err) => {
        console.error("Error fetching app:", err);
        setError("Failed to load app");
      });
  }, []); // Empty dependency array to run once on mount

  return (
    <div>
      <h1>Quickbase Test</h1>
      {error ? <p>{error}</p> : <p>App Name: {appName}</p>}
    </div>
  );
};

export default App;
