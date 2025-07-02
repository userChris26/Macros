/*import React, { useState } from 'react';
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';

function Login()
{
    const [message,setMessage] = useState('');
    const [login,setLogin] = React.useState('');
    const [password,setPassword] = React.useState('');
    async function doLogin(event:any) : Promise<void>
    {
        event.preventDefault();

        var obj = {userLogin:login, userPassword:password};
        var js = JSON.stringify(obj);

        try
        {
            const response = await fetch(buildPath('api/login'),
                {method:'POST', body:js, headers:{'Content-Type':'application/json'}});
            
            var res = JSON.parse(await response.text());
            const { accessToken } = res;
            storeToken( res );

            const decoded : any = jwtDecode(accessToken); // Jank workaround

            try
            {

                var ud = decoded;

                var userId = ud.iat;
                var firstName = ud.firstName;
                var lastName = ud.lastName;
                
                if (userId! <= 0)
                {
                    setMessage('User/Password combination incorrect');
                }
                else
                {
                    var user = {firstName:firstName, lastName:lastName, id:userId};
                    localStorage.setItem('user_data', JSON.stringify(user));
                    
                    setMessage('');
                    window.location.href = '/cards';
                }
            }
            catch(e)
            {
                console.log(e);
                return;
            }
            
        }
        catch(error:any)
        {
            alert(error.toString());
            return;
        }
    };

    function doRegister(event:any) : void
    {
        event.preventDefault();
        window.location.href = '/register';
    };

    function handleSetLogin( event: any ) : void
    {
        setLogin( event.target.value );
    }
    
    function handleSetPassword( event: any ) : void
    {
        setPassword( event.target.value );
    }
    
    return(
    <div id="loginDiv">
        <span id="inner-title">PLEASE LOG IN</span><br />
        Login: <input type="text" id="userLogin" placeholder="Username"
            onChange={handleSetLogin} /> <br />
        Password: <input type="password" id="userPassword" placeholder="Password"
            onChange={handleSetPassword} /> <br />
        <input type="submit" id="loginButton" className="buttons" value = "Do It"
        onClick={doLogin} />
        <span id="loginResult">{message}</span> <br />
        <button type="button" id="registerButton" className="buttons"
                onClick={doRegister}> Register </button>
    </div>
    );
};

export default Login;*/
import { useState } from 'react';


const app_name = '64.225.3.4'; // Updated to your production server IP

function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development'){
    return 'http://' + app_name + ':5000/' + route;
  } else {
    return 'http://localhost:5000/' + route;
  }
}

function Login() {
  // State variables for message, login name, and login password
  const [message, setMessage] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setPassword] = useState('');

  // Handler function for updating the loginName state
  function handleSetLoginName(e: any): void {
    setLoginName(e.target.value);
  }

  // Handler function for updating the loginPassword state
  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  // Asynchronous function to handle the login process, making an API call
  async function doLogin(event: any): Promise<void> {
    event.preventDefault(); // Prevents the default form submission behavior

    // === TRIM WHITESPACE TO FIX THE 'rickl ' ISSUE ===
    const trimmedLogin = loginName.trim();
    const trimmedPassword = loginPassword.trim();

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Original login name:', `"${loginName}"`);
    console.log('Trimmed login name:', `"${trimmedLogin}"`);
    console.log('Has trailing space?', loginName !== trimmedLogin);

    // Validate inputs
    if (!trimmedLogin || !trimmedPassword) {
      setMessage('Please enter both username and password');
      return;
    }

    // Updated to match server expectations: userLogin and userPassword
    const obj = { 
      userLogin: trimmedLogin,     // Use trimmed value
      userPassword: trimmedPassword // Use trimmed value
    };
    const js = JSON.stringify(obj);

    try {
      console.log('Sending login request...');
      console.log('API URL:', buildPath('api/login')); // Debug log to see the URL
      
      const response = await fetch(buildPath('api/login'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Response status:', response.status);

      // Get response as text first to debug
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Parse the response
      let res;
      try {
        res = JSON.parse(responseText);
        console.log('Parsed response:', res);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        setMessage('Server error - invalid response');
        return;
      }

      if (res.id <= 0 || res.error) {
        console.log(' Login failed:', res.error || 'Invalid credentials');
        setMessage(res.error || 'User/Password combination incorrect');
      } else {
        console.log(' Login successful!');
        
        const user = {
          firstName: res.firstName,
          lastName: res.lastName,
          id: res.id,  // This should now be 1 (your UserID)
          login: trimmedLogin
        };
        
        // Store user data in local storage
        localStorage.setItem('user_data', JSON.stringify(user));
        console.log('Stored user data:', user);
        
        setMessage('Login successful! Redirecting...');
        
        // Clear the form
        setLoginName('');
        setPassword('');
        
        // Redirect the user to the calorie tracker dashboard
        setTimeout(() => {
          window.location.href = '/cards'; // or '/calorietracker'
        }, 1000);
      }
    } catch (error: any) {
      console.error('Login network error:', error);
      setMessage('Network error: ' + error.toString());
    }
  }

  return (
    <div id="loginDiv">
      <span id="inner-title">WELCOME TO CALORIE TRACKER</span><br />
      <span id="login-subtitle">Please log in to continue</span><br /><br />

      {/* Input field for username */}
      <label htmlFor="loginName">Username:</label>
      <input
        type="text"
        id="loginName"
        placeholder="Enter your username"
        value={loginName}
        onChange={handleSetLoginName} // Attach the handler to update state on change
      /><br />

      {/* Input field for password */}
      <label htmlFor="loginPassword">Password:</label>
      <input
        type="password"
        id="loginPassword"
        placeholder="Enter your password"
        value={loginPassword}
        onChange={handleSetPassword} // Attach the handler to update state on change
      /><br />

      {/* Login button */}
      <input
        type="submit"
        id="loginButton"
        className="buttons"
        value="Log In"
        onClick={doLogin} // Attach the doLogin function to the button click
      />
      
      {/* Span for displaying output messages */}
      <span id="loginResult">{message}</span>
      
      <br /><br />
      <span id="register-link">
        Don't have an account? <a href="/register">Sign up here</a>
      </span>

      {/* Debug section - remove this after fixing */}
      <div style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
        <details>
          <summary>Debug Info (click to expand)</summary>
          <p>Current login value: "{loginName}"</p>
          <p>Current login length: {loginName.length}</p>
          <p>Trimmed login: "{loginName.trim()}"</p>
          <p>Has whitespace? {loginName !== loginName.trim() ? 'Yes' : 'No'}</p>
          <p>API URL will be: {buildPath('api/login')}</p>
        </details>
      </div>
    </div>
  );
}

export default Login;