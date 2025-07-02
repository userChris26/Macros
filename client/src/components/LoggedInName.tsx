/*function LoggedInName()
{
    let _ud : any = localStorage.getItem('user_data');
    let ud = JSON.parse( _ud );
    let firstName : string = ud.firstName;
    let lastName : string = ud.lastName;

    function doLogout(event:any) : void
    {
        event.preventDefault();
        localStorage.removeItem("user_data")
        window.location.href = '/';
    };
    
    return(
        <div id="loggedInDiv">
            <span id="userName">Logged In As {firstName} {lastName} </span><br />
            <button type="button" id="logoutButton" className="buttons"
                onClick={doLogout}> Log Out </button>
        </div>
    );
};
export default LoggedInName;*/
import { useState, useEffect } from 'react';

function LoggedInName() {
  const [userName, setUserName] = useState('');

  /**
   * Load user data from localStorage on component mount
   */
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const fullName = `${user.firstName} ${user.lastName}`;
        setUserName(fullName);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserName('User');
      }
    }
  }, []);

  /**
   * Handles the logout process.
   * Prevents the default event, removes user data from local storage,
   * and redirects the user to the home page.
   * @param event The event object.
   */
  function doLogout(event: any): void {
    event.preventDefault(); // Prevent the default form submission or button click behavior
    localStorage.removeItem("user_data"); // Remove the 'user_data' item from local storage
    window.location.href = '/'; // Redirect the user to the root path of the application
  }

  return (
    <div id="loggedInDiv">
      {/* Display the logged-in user's name dynamically from localStorage */}
      <span id="userName">Welcome, {userName || 'User'}!</span><br />
      <span id="appTitle">Calorie Tracker</span><br />
      {/* Logout button */}
      <button
        type="button"
        id="logoutButton"
        className="buttons"
        onClick={doLogout} // Attach the doLogout function to the button's click event
      >
        Log Out
      </button>
    </div>
  );
}

export default LoggedInName;