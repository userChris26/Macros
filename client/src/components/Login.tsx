import React, { useState } from 'react';
import buildPath from './Path.js';

function Login()
{
    const [message,setMessage] = useState('');
    const [login,setLogin] = React.useState('');
    const [password,setPassword] = React.useState('');

    async function doLogin(event:any) : Promise<void>
    {
        event.preventDefault();

        var obj = {userLogin:login,userPassword:password};
        var js = JSON.stringify(obj);

        try
        {
            const response = await fetch(buildPath('api/login'),
                {method:'POST',body:js,headers:{'Content-Type':
                'application/json'}});
            var res = JSON.parse(await response.text());
            
            if( res.id <= 0 )
            {
                setMessage('User/Password combination incorrect');
            }
            else
            {
                var user =
                {firstName:res.firstName,lastName:res.lastName,id:res.id}
                    localStorage.setItem('user_data', JSON.stringify(user));
                    setMessage('');
                window.location.href = '/cards';
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

    function handleSetLogin( e: any ) : void
    {
        setLogin( e.target.value );
    }
    
    function handleSetPassword( e: any ) : void
    {
        setPassword( e.target.value );
    }
    return(
    <div id="loginDiv">
        <span id="inner-title">PLEASE LOG IN</span><br />
        Login: <input type="text" id="userLogin" placeholder="Username"
            onChange={handleSetLogin} />
        Password: <input type="password" id="userPassword" placeholder="Password"
            onChange={handleSetPassword} />
        <input type="submit" id="loginButton" className="buttons" value = "Do It"
        onClick={doLogin} />
        <span id="loginResult">{message}</span> <br />
        <button type="button" id="registerButton" className="buttons"
                onClick={doRegister}> Register </button>
    </div>
    );
};

export default Login;