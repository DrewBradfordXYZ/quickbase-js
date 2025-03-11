import { quickbase } from "quickbase-js";
import { useEffect, useState } from "react";

const qb = quickbase({
  realm: "myrealm",
  userToken: "my-user-token",
});

function App() {
  const [app, setApp] = useState < any > null;

  useEffect(() => {
    qb.getApp({ appId: "my-app-id" })
      .then((data) => setApp(data))
      .catch((err) => console.error(err));
  }, []);

  return <div>{app ? app.name : "Loading..."}</div>;
}

export default App;
