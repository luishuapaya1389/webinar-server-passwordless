import jwt from 'jsonwebtoken';
import dbService from '../services/dbService.js';
import { ERROR_PASSKEY_REGISTRATION, ERROR_USER_EXISTS } from '../helpers/constants.js';
import { getClientAccessToken, registerPasskey, authPasskey } from '../services/transmitService.js';


const registerUserPasskey = async (webauthnEncodedResult, userid) => {
  try {
    // Check if user already exists
    if (dbService.getUserByUserId(userid)) {
      console.log(`User ${userid} already exists`);
      throw new Error(ERROR_USER_EXISTS);
    }

    // Register Passkey
    const clientAccessToken = await getClientAccessToken();
    const passkeyInfo = await registerPasskey(webauthnEncodedResult, userid, clientAccessToken);
    // Save user in database
    console.log({ userid, passkeyInfo });
    await dbService.addUser({ userid, passkeyInfo });

    const loginData = {
      userid,
      signInTime: Date.now(),
    };

    const token = jwt.sign(loginData, process.env.JWT_SECRET_KEY);
    console.log(`User created successfully: ${userid}, token: ${token}`);
    return token;
  } catch (error) {
    console.error(`${ERROR_PASSKEY_REGISTRATION}: ${error.message}`);
    throw new Error(`${ERROR_PASSKEY_REGISTRATION}: ${error.message}`);
  }
};

/**
 * Authenticate a user with Passkey credentials
 * @param {String} webauthnEncodedResult Webauthn encoded result returned by authenticate() SDK call
 * @param {String} userid User identifier
 * @returns JWT token for the user
 */
const authUserPasskey = async (webauthnEncodedResult, userid) => {
    // Look up the user entry in the database
    const user = dbService.getUserByUserId(userid);
  
    // If found, go ahead with passkey authentication
    if (user) {
      try {
        // Authenticate with Passkey
        const clientAccessToken = await getClientAccessToken();
        const authInfo = await authPasskey(webauthnEncodedResult, clientAccessToken);
        console.log(`User authenticated: ${JSON.stringify(authInfo, null, 2)}`);
  
        const loginData = {
          userid,
          signInTime: Date.now(),
        };
    
        const token = jwt.sign(loginData, process.env.JWT_SECRET_KEY);
        return token;
      } catch (error) {
        console.error(`${ERROR_PASSKEY_AUTHENTICATION}: ${error.message}`);
        throw new Error(ERROR_PASSKEY_AUTHENTICATION);
      }
    } else {
      console.log('Error authenticating user: user not found');
      throw new Error(ERROR_AUTHENTICATION);
    }
  };

  export default { registerUserPasskey, authUserPasskey };