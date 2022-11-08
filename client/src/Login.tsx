import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles/login.scss';

/**
 * Catch their respective event from the electron main process
 * Need to be outside of the Login component, otherwise they will fire twice
 */

function Login() {
  let navigate = useNavigate();
  // Message to send to the user on invalid input
  const badCredentials = "Invalid Credentials"
  // State will be null, but won't be if navigated from app
  // Don't autoload user into app if they navigated from app
  let { state } = useLocation();
  const autoLoad = state === null ? true : false;

  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [clusterName, setClusterName] = useState("");
  const [regionName, setRegionName] = useState("");

  // Only fire on initial render
  // Executes twice because of React.Strict
  useEffect(() => {
    // On mount
    // Don't load user in if they just logged out
    if(autoLoad !== false) {
      loginUser(true);
    } else {
      // Then load config
      window.electronAPI.getConfig();
    }
    // Response after trying to update local cred/config files
    window.electronAPI.onConfigResp('onConfigResp', (event: any, data: any) => {
      console.log("From server:", data)
      // The fourth datapoint is whether the kube config was set properly
      // Only attempt to log the user in if kube config was created
      if(data[4]) {
        loginUser(false);
      } else {
        alert(badCredentials);
      }
    })
    // Why is this executing twice?
    // Response after parsing local cred/config files
    window.electronAPI.onSendConfig('onSendConfig', (event: any, data: [string, string, string, string]) => {
      console.log("Parsed from local files:", data);
      // Update each input field
      setAccessKey(data[0]);
      setSecretKey(data[1]);
      setClusterName(data[2]);
      setRegionName(data[3]);
    })

    return () => {
      console.log('useEffect: unmount');
      window.electronAPI.unMount();
    };
  }, [])

  const loginUser = (loadConfig : boolean) => {
    //alert('id:' + accessKey + ' secret:' + secretKey);

    fetch('http://localhost:3000/authenticate', {
      method: 'GET'
    })
      .then(response => {
        //console.log('resp:', resp.json());
        //console.log('typeof:', typeof response.json());
        //console.log(response.json());
        console.log('status:', response.status);
        if (response.status !== 200) {
          console.log('bad credentials...');
          alert(badCredentials)
          // Leverage Electron to parse authentication data from local files
          if(loadConfig) window.electronAPI.getConfig();
          return;
        }
        else {
          console.log('Valid creds!');
          navigate('/app');
          return;
        }
      }).catch(err => {
        console.log('bad credentials...');
        // Leverage Electron to parse authentication data from local files
        if(loadConfig) window.electronAPI.getConfig();
        return;       
      })
  }

  // Returns true if the input string is empty
  const emptyString = (input : string ) => {
    if(input.trim() === '') return true;
    return false;    
  }

  const buttonPressed = (event: FormEvent) => {
    event.preventDefault();

    // Don't submit if any of the fields are empty
    if(emptyString(accessKey) || emptyString(secretKey) || emptyString(clusterName) || emptyString(regionName)) {
      alert('Please fill out all fields');
      return;
    }

    // Configure the user's local files with the input fields
    window.electronAPI.onConfig([accessKey, secretKey, clusterName, regionName]);

    return;
  }

  // Need an environmental condition to avoid logging in user if they just logged out
  // Need to render the background with the "loading icon"
  //loginUser();

  return (
    <div id="login" >
      <div id="login-container">
        <div id="logo" />
        <h3 id="login-label">Login</h3>
        <form onSubmit={buttonPressed}>

          <div>
            <label>
              AWS Access Key ID:
              <input type="text" placeholder="Enter your access key ID" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} />
            </label>
          </div>

          <div>
            <label>
              AWS Secret Access Key:
              <input type="password" placeholder="Enter your secret access key" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} />
            </label>
          </div>

          <div >
            <label>
              Cluster Name:
              <input type="text" placeholder="Enter the Cluster's name" value={clusterName} onChange={(e) => setClusterName(e.target.value)} />
            </label>
          </div>

          <div>
            <label>
              Region:
              <input type="text" placeholder="Enter the Cluster's region" value={regionName} onChange={(e) => setRegionName(e.target.value)} />
            </label>
          </div>

          <button type="submit" id="login-button">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;