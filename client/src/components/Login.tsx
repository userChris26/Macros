import React, { useState } from 'react';
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

export default Login;