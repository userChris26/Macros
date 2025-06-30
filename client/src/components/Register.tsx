import React, { useState } from 'react';
import { buildPath } from './Path';

function Register()
{
    const [message,setMessage] = useState('');
    const [firstName,setFirstName] = React.useState('');
    const [lastName,setLastName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [login,setLogin] = React.useState('');
    const [password,setPassword] = React.useState('');

    async function doRegister(event:any) : Promise<void>
    {
        event.preventDefault();

        var obj = {userEmail:email, userLogin:login, userPassword:password,
            userFirstName:firstName, userLastName:lastName};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
                fetch(buildPath('api/register'),
                {method:'POST', body:js, headers:{'Content-Type':
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

    function handleSetFirstName( event: any ) : void
    {
        setFirstName( event.target.value );
    }
    
    function handleSetLastName( event: any ) : void
    {
        setLastName( event.target.value );
    }

    function handleSetEmail( event: any ) : void
    {
        setEmail( event.target.value );
    }

    function handleSetLogin( event: any ) : void
    {
        setLogin( event.target.value );
    }
    
    function handleSetPassword( event: any ) : void
    {
        setPassword( event.target.value );
    }

    return(
    <div id="registerDiv">
        <span id="inner-title">PLEASE REGISTER</span><br />
        First Name: <input type="text" id="userFirstName" placeholder="First Name"
            onChange={handleSetFirstName} /> <br />
        Last Name: <input type="text" id="userLastName" placeholder="Last Name"
            onChange={handleSetLastName} /> <br />
        Email: <input type="text" id="userEmail" placeholder="Email"
            onChange={handleSetEmail} /> <br />
        Login: <input type="text" id="userLogin" placeholder="Username"
            onChange={handleSetLogin} /> <br />
        Password: <input type="password" id="userPassword" placeholder="Password"
            onChange={handleSetPassword} /> <br />
        <input type="submit" id="registerButton" className="buttons" value = "Do It"
        onClick={doRegister} />
        <span id="registerResult">{message}</span> <br />
        <button type="button" id="backButton" className="buttons"
                onClick={doBack}> Back </button>
    </div>
    );
};

export default Register;