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

                // Extract email from userData
                const email = userData.username;

                // Call the SNS API directly using fetch
                fetch('https://mifllmhwt9.execute-api.us-east-1.amazonaws.com/dev/sns/createTopic', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email
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

                // Extract email from response (Assuming email is available in the response object)
                const email = username; // You may need to adjust this depending on your response structure
                const message = "You logged in successfully in Social Network"; // Customize the message as needed

                // Call the SNS API directly using fetch to send the notification
                fetch('https://mifllmhwt9.execute-api.us-east-1.amazonaws.com/dev/sns/sendNotification', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        message: message
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
