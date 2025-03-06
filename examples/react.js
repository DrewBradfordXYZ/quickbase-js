import { quickbaseClient } from "quickbase-js";
import { useEffect, useState } from "react";

const client = quickbaseClient({
  realm: "myrealm",
  userToken: "my-user-token",
});

function App() {
  const [app, setApp] = useState < any > null;

  useEffect(() => {
    client
      .getApp({ appId: "my-app-id" })
      .then((data) => setApp(data))
      .catch((err) => console.error(err));
  }, []);

  return <div>{app ? app.name : "Loading..."}</div>;
}

export default App;
