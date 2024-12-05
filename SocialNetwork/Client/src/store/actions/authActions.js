import { LOGIN_SUCCESS, LOGIN_ERROR, REDIRECTED, REGISTER_SUCCESS, REGISTER_ERROR, LOGOUT_SUCCESS } from './actionTypes';
import { ajaxBegin, ajaxEnd } from './ajaxActions';
import { requester } from '../../infrastructure';

function registerSuccess(message) {
    return {
        type: REGISTER_SUCCESS,
        message
    }
}

function registerError(messsage) {
    return {
        type: REGISTER_ERROR,
        messsage
    }
}

function loginSuccess() {
    return {
        type: LOGIN_SUCCESS,
    }
}

function loginError(messsage) {
    return {
        type: LOGIN_ERROR,
        messsage
    }
}

function redirectAction() {
    return {
        type: REDIRECTED
    }
}

function logoutSuccess() {
    return {
        type: LOGOUT_SUCCESS
    }
}


function registerAction(userData) {
    return (dispatch) => {
        dispatch(ajaxBegin());
        console.log(userData);

        return requester.post('/users/register', { ...userData }, (response) => {
            if (response.success === true) {
                dispatch(registerSuccess(response.message));

                // Extract the username and email from userData
                const username = userData.username;
                const email = userData.email;

                // Call the SNS API to create the topic and subscribe the email
                fetch('https://mifllmhwt9.execute-api.us-east-1.amazonaws.com/dev/sns/createTopic', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,  // Use username as topic name
                        email: email         // Subscribe the email to the topic
                    })
                })
                .then(response => response.json())  // Parse the JSON response
                .then((snsResponse) => {
                    // Handle the response from the SNS API
                    console.log(snsResponse);
                })
                .catch((err) => {
                    // Handle errors in calling the SNS API
                    console.error("Error calling SNS API: ", err.message);
                });

            } else {
                dispatch(registerError(response.message));
            }
            dispatch(ajaxEnd());
        }).catch(err => {
            dispatch(registerError(`${err.message}`));
            dispatch(ajaxEnd());
        });
    }
}

function loginAction(username, password) {
    return (dispatch) => {
        dispatch(ajaxBegin());
        
        return requester.post('/login', { username, password }, (response) => {
            if (response.error) {
                dispatch(loginError('Incorrect credentials!'));
            } else {
                // Save the token if login is successful
                saveToken(response);
                dispatch(loginSuccess());

                // Assuming the username is unique, use it to send the notification
                const message = "You logged in successfully in Social Network"; // Customize the message as needed

                // Call the SNS API directly using fetch to send the notification to all subscribers of the topic
                fetch('https://mifllmhwt9.execute-api.us-east-1.amazonaws.com/dev/sns/sendNotification', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,  // Use username to identify the SNS topic
                        message: message      // Custom message to be sent to all subscribers
                    })
                })
                .then(response => response.json())  // Parse the JSON response
                .then((snsResponse) => {
                    // Handle the response from the SNS API (optional)
                    console.log(snsResponse);
                })
                .catch((err) => {
                    // Handle errors in calling the SNS API
                    console.error("Error calling SNS API: ", err.message);
                });
            }

            dispatch(ajaxEnd());
        }).catch(err => {
            localStorage.clear();
            dispatch(loginError(`${err.message}`));
            dispatch(ajaxEnd());
        });
    }
}

function logoutAction() {
    return (dispatch) => {
        localStorage.clear();
        dispatch(logoutSuccess())
    }
}


function saveToken(response) {
    const token = response.split(' ')[1];
    localStorage.setItem('token', token);
}

export { loginAction, redirectAction, registerAction, logoutAction };
