## Experience Setup - to be done by "Team B Flats"
1) Ensure the headset is charged and powered on.
2) Go to settings > physical space > space setup > "Set Up"
3) After setting up, ensure that there are planes encircling the entire room -- no open-ended parts of room
4) After setting up, ensure that the guardian barrier encompasses the entire room
5) In the headset, go to browser, enter URL of application. Ensure that the login screen loads. Ensure that the user is logged out, there is no currently logged-in user.
6) On a computer, go to browser, enter URL of application. Instruct the User to create a new account, with a suggested username (judge) and password (Testing123!)

## User Experience - to be done by user
1) On a computer using a real keyboard, open URL of application in browser and create a new account, with a suggested username (judge) and password (Testing123!).
2) Put on the headset which should have the browser open to the application window.
3) The user will need to log-in.
4) Then the user will see the app welcome screen with instructions to press the play button.
5) Then the user will need to ensure they are standing on the "starting position" and hold down the grip controls for 3 seconds. Doing so will create a new anchor at the orientation and position of the camera (ie the user's perspective)
6) Then the user will see instructions and an interface for interacting with the scene.

## Dev Setup

Navigate to the `infra/` folder from the project root, and delete the cloud assembly output folder

```
rm -rf cdk.out
```

Go to the `web` folder, and run

```
npm install
npm run build
```

Go to the `infra` folder, and run
```
npm install
cdk bootstrap aws://<YOUR_ACCOUNT_ID>/<YOUR_REGION>
cdk deploy --require-approval never
```

Go to the `web/src` folder, open `amplifyconfigure.js`, and replace the parameters with values from your CDK output. Also, update the region if you are using us-west-2.

```javascript
Auth: {
    // REQUIRED - Amazon Cognito Identity Pool ID
    identityPoolId: '<REPLACE_W_YOUR_IDENTITYPOOLID>',
    
    // REQUIRED - Amazon Cognito Region
    region: 'US-EAST-1',
    
    // REQUIRED- Amazon Cognito User Pool ID
    userPoolId: '<REPLACE_W_YOUR_USERPOOLID>',

    userPoolWebClientId: '<REPLACE_W_YOUR_USERPOOLWEBCLIENTID>',

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: true,
  },
  Api: {
    url: '<REPLACE_W_YOUR_APIRESTURL>'
  }
```

This configuration enables Amplify to interact with the AWS resources that were deployed using the CDK.

### Test the application locally

Navigate to the `web/` folder and run:

```
npm run serve 
```

Open [localhost:8081](https://localhost:8081) in a browser. Notice you're presented with a login prompt.

Enter a username, password, and your email address, and click "Sign Up"

![app login prompt](images/app-login.png)

Email verification is disabled, so go ahead and click "Sign In" with your new user account to access the game.

### Architecture notes

- As a user, I set an anchor point for the scene origin at a predetermined physical location in the room.
- I can place objects and each objects will have a world position relative to that origin.
- Each object will have a vec3 position (xyz) and vec4 quaternion (xyzw), and perhaps additional info such as objectType
***
- As a user coming into a scene that already has elements placed... I set an anchor point.
- For all objects in the database that are associated with this scene, load each and create the object in the vec3 xyz position and vec4 rotation relative to the anchor point.