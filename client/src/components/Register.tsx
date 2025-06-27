import React, { useState } from 'react';
import buildPath from './Path';

function Register()
{
    const [message,setMessage] = useState('');
    const [firstName,setFirstName] = React.useState('');
    const [lastName,setLastName] = React.useState('');
    const [login,setLogin] = React.useState('');
    const [password,setPassword] = React.useState('');

    async function doRegister(event:any) : Promise<void>
    {
        event.preventDefault();

        var obj = {userLogin:login,userPassword:password,userFirstName:firstName,userLastName:lastName};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
                fetch(buildPath('api/register'),
                {method:'POST',body:js,headers:{'Content-Type':
                'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error.length > 0 )
            {
                setMessage( "API Error:" + res.error );
            }
            else
            {
                setMessage('Account has been added');
                window.location.href = '/';
            }
        }
        catch(error:any)
        {
            setMessage(error.toString());
        }
    };

    function doBack(event:any) : void
    {
        event.preventDefault();

        window.location.href = '/';
    };

    function handleSetFirstName( e: any ) : void
    {
        setFirstName( e.target.value );
    }
    
    function handleSetLastName( e: any ) : void
    {
        setLastName( e.target.value );
    }

    function handleSetLogin( e: any ) : void
    {
        setLogin( e.target.value );
    }
    
    function handleSetPassword( e: any ) : void
    {
        setPassword( e.target.value );
    }
    return(
    <div id="registerDiv">
        <span id="inner-title">PLEASE REGISTER</span><br />
        First Name: <input type="text" id="userFirstName" placeholder="First Name"
            onChange={handleSetFirstName} />
        Last Name: <input type="text" id="userLastName" placeholder="Last Name"
            onChange={handleSetLastName} />
        Login: <input type="text" id="userLogin" placeholder="Username"
            onChange={handleSetLogin} />
        Password: <input type="password" id="userPassword" placeholder="Password"
            onChange={handleSetPassword} />
        <input type="submit" id="registerButton" className="buttons" value = "Register"
        onClick={doRegister} />
        <span id="registerResult">{message}</span> <br />
        <button type="button" id="backButton" className="buttons"
                onClick={doBack}> Back </button>
    </div>
    );
};

export default Register;