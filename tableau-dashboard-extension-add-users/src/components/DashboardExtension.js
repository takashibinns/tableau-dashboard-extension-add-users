import React from "react";
import { Button } from '@tableau/tableau-ui';
import { toast } from 'react-toastify';

/* global tableau */

//  Helper Function for authenticating to Tableau's REST API
//  Returns { siteId: 'aaa', apiToken: 'bbb' }
const tableauAuthenticate = async (tableauUrl, apiVersion, siteName, username, password) => {

  //  Define the API call's URL
  const url = `${tableauUrl}/api/${apiVersion}/auth/signin`;

  //  Define the options for the HTTP request
  const options =  {
    method: 'POST',
    body: JSON.stringify({
      "credentials": {
        "name": username,
        "password": password,
        "site": {
          "contentUrl": siteName
        }
      }
    }),
    headers: {
       'Content-type': 'application/json',
       'Accept': 'application/json',
    }
  };

  //  Execute the API call
  const resp = await fetch(url,options);
  const response = await resp.json();

  try {
    if (response.error) {
      console.log(response.error.detail)
      return {}
    } else {
      return {
        siteId: response.credentials.site.id,
        apiToken: response.credentials.token
      }
    }
  } catch (err) {
    console.log(err)
    return {}
  }
}

//  Helper Function for authenticating to Tableau's REST API
//  Returns [ { userId: 'abc', error: 'error message from tableau' }, ... ]
const tableauAddUsers = async (tableauUrl, apiVersion, siteId, apiToken, users) => {

  //  Using Tableau Server or Tableau Cloud
  const isTableauServer = (tableauUrl.search('online.tableau.com') === -1);

  //  Define the API call's URL
  const createUserUrl = `${tableauUrl}/api/${apiVersion}/sites/${siteId}/users`;

  //  Create an array of promises (one API call per user to add)
  const usersAdded = await Promise.all(users.map(async user => {

    //  Define the options for the HTTP request
    const options =  {
      method: 'POST',
      body: JSON.stringify({
        "user": {
          "name": user.name,
          "siteRole": user.siteRole,
          "authSetting": user.authSetting
        }
      }),
      headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json',
        'X-Tableau-Auth': apiToken
      }
    };

    //  Make the API call
    const resp = await fetch(createUserUrl,options);

    //  Check for errors from Tableau
    if (resp.status === 409) {
      user.error = "The specified user already exists on the site";
    } else if(resp.status === 404) {
      user.error = "The server is configured to use Active Directory for authentication, and the username specified in the request body doesn't match an existing user in Active Directory.";
    } else if (resp.status === 400) {
      user.error = "The value of the siteRole attribute must be Explorer, ExplorerCanPublish, SiteAdministratorCreator, SiteAdministratorExplorer, Unlicensed, or Viewer.";
    } else {
      //  No errors from Tableau, user was created successfully
      const newUser = await resp.json()
      user.id = newUser.user.id
    }
    return user;
  }))

  //  Loop through all users, and make the Update User API call
  let usersUpdated = [];
  if (isTableauServer) {
    usersUpdated = await Promise.all(usersAdded.map(async user => {

      //  Skip if there was an error when creating the user
      if (user.error) { 
        return user;
      }

      //  Define the 2nd API call's URL
      const updateUserUrl = `${tableauUrl}/api/${apiVersion}/sites/${siteId}/users/${user.id}`;

      //  Define the options for the HTTP request
      const options =  {
        method: 'PUT',
        body: JSON.stringify({
          "user": {
            "fullName": user.name,
            "email": user.siteRole,
            "password": user.password
          }
        }),
        headers: {
          'Content-type': 'application/json',
          'Accept': 'application/json',
          'X-Tableau-Auth': apiToken
        }
      };

      //  Make the API call
      const resp = await fetch(updateUserUrl,options);

      //  Check for errors from Tableau
      if (resp.status === 400) {
        user.error = "The email attribute does not contain a valid email address.";
      } else if(resp.status === 403) {
        user.error = "A user cannot update their own licensing role.";
      } else if (resp.status === 404) {
        user.error = "The user ID in the URI doesn't correspond to an existing user.";
      } else if (resp.status === 409) {
        user.error = "The user with the specified name is already registered on the site in the same domain OR the request is attempting to update the user to a licensing role that has insufficient capacity."
      } else {
        //  No errors from Tableau, user was created successfully
        const newUser = await resp.json()
        user.id = newUser.user.id
      }
      return user;
    }))
  }

  //  Figure out the status update to display to the end user
  const finalUserList = isTableauServer ? usersUpdated : usersAdded;
  const errorUsers = finalUserList.filter( user => { return user.error } ).map( user => { return <div style={{fontSize:"small"}} key={user.name} >{user.name}: {user.error}<br/></div> });
  const successUsers = finalUserList.filter( user => { return !user.error; } );
  if (successUsers.length>0 &&  errorUsers.length>0){
    toast.warn(<div>{successUsers.length} users added to Tableau successfully, but the following users were unable to be added:<br/>{errorUsers}</div>);
  } else if (successUsers.length===0 &&  errorUsers.length>0){
    toast.error(<div>No users were added to Tableau successfully: <br />{errorUsers}</div>);
  } else {
    toast.success(`${successUsers.length} users added to Tableau successfully`);
  }

  //  Return a list of added users
  return finalUserList;
};


//  Helper Function to get the data behind a worksheet within the dashboard
//  Returns a DataTable object (https://tableau.github.io/extensions-api/docs/interfaces/datatable.html)
const getDataFromTableau = async (sheetName) => {
    
  //  Get the current dashboard
  const dashboard = tableau.extensions.dashboardContent.dashboard;

  //  Get the worksheet with our data
  const matches = dashboard.worksheets.filter((ws) => { return ws.name === sheetName; });

  //  Get the summary data from the selected worksheet
  if (matches.length === 1) {

    //  Worksheet found!
    const worksheet = matches[0];
    
    //  Fetch the data in that worksheet
    const data = await worksheet.getSummaryDataAsync();

    //  Do we have the required columns in this sheet?
    const requiredFields = ['name','fullName','siteRole','authSetting'];
    let fieldLookup = {};
    let missingFields = [];

    //  Check each required field
    requiredFields.forEach( requiredField => {
      const fieldMatch = data.columns.filter( col => { return col.fieldName === requiredField; } );
      if (fieldMatch.length === 0) {
        //  No field found, add it to the list of missing data fields
        missingFields.push(requiredField);
      } else {
        //  Field found, save a reference to it's index (column number)
        fieldLookup[requiredField] = fieldMatch[0].index;
      }
    })

    //  If any fields are missing, notify the user and return null
    if (missingFields.length > 0) {
      toast.error(`Worksheet ${sheetName} is missing the following data fields: ${missingFields.join(', ')}`)
      return null;
    } 

    //  Convert the datatable into an array of user objects
    //  { "name":"myname@test.com", "fullName": "My Name", "siteRole": "creator", "authSetting": "ServerDefault" }
    let users = [];
    data.data.forEach( row => {
      users.push({
        "name":         row[fieldLookup.name]         ? row[fieldLookup.name].value         : "",
        "fullName":     row[fieldLookup.fullName]     ? row[fieldLookup.fullName].value     : "",
        "siteRole":     row[fieldLookup.siteRole]     ? row[fieldLookup.siteRole].value     : "",
        "authSetting":  row[fieldLookup.authSetting]  ? row[fieldLookup.authSetting].value  : ""
      })
    })

    //  Return a list of users
    return users;
  }
  
  //  No worksheet found, return an empty data set
  return null;
}

export class DashboardExtension extends React.Component {

  //  Look for any saved settings, set them to the state
  constructor(props) {
    super(props);
    this.state = {
      tableauUrl: "test",
      apiVersion: "",
      siteName: "",
      username: "",
      password: "",
      dataSheet: "",
      isSaving: false
    }

    this.addUsersToTableau = this.addUsersToTableau.bind(this);
  }

  //  Run when the component first mounts
  componentDidMount() {

    //  Save a reference to this
    let thisComponent = this;

    //  Function that runs when the user clicks the configure button in Tableau
    function configure () {

      //  Determine the config popup's url
      const url = window.location.origin + "/config";
    
      //  Initialize the extension's config popup     
      tableau.extensions.ui.displayDialogAsync(url, "", { height: 500, width:400 } ).then((closePayload) => {
        loadSettings()
      }).catch((error) => {
        // One expected error condition is when the popup is closed by the user (meaning the user
        // clicks the 'X' in the top right of the dialog).  This can be checked for like so:
        switch (error.errorCode) {
          case tableau.ErrorCodes.DialogClosedByUser:
            console.log("Config popup was closed by user");
            break;
          default:
            console.log(error.message);
        }
      });
    }

    //  Function to get the tableau settings and update state
    function loadSettings(){
      //  Fetch the new settings from tableau api
      const settingsString = tableau.extensions.settings.get(thisComponent.props.settingsKey)
      if (settingsString) {
        //  Found some config settings, set the state
        thisComponent.setState(JSON.parse(settingsString))
      }
    }

    //  Initialize the extension
    tableau.extensions.initializeAsync({"configure": configure}).then(function () {

      //  Mark the tableau api as loaded
      loadSettings()

      //  Watch for updates to settings
      tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
        loadSettings()
      });
    });
    
  }

  //  Add Users to Tableau
  async addUsersToTableau() {

    /**************************************************/
    /*  Step 1: make sure we have all settings needed */
    /**************************************************/

    //  Get the necessary properties from the state
    const tableauUrl = this.state.tableauUrl,
          apiVersion = this.state.apiVersion,
          siteName = this.state.siteName,
          username = this.state.username,
          password = this.state.password;
    
    //  TODO - check to verify all are valid

    //  Update the state, to show a spinner while we wait
    this.setState({isSaving: true});

    /**************************************************/
    /*  Step 2: login to Tableau via REST API         */
    /**************************************************/

    //  Get an API token and the site's ID from Tableau
    const auth = await tableauAuthenticate(tableauUrl, apiVersion, siteName, username, password)

    //  Check for errors from the API call
    if (!auth.apiToken) {
      this.setState({isSaving: false});
      return null;
    }

    /**************************************************/
    /*  Step 3: Get the list of users from a sheet    */
    /**************************************************/
    
    //  Get the list of users
    const users = await getDataFromTableau(this.state.dataSheet);
    if (!users) {
      this.setState({isSaving: false});
      return null;
    }

    /**************************************************/
    /*  Step 4: Execute all Add User to Site API calls*/
    /**************************************************/

    //  Add the users via REST API
    const addUsers = await tableauAddUsers(tableauUrl, apiVersion, auth.siteId, auth.apiToken, users);

    //  Update the state, to hide the spinner while we wait
    this.setState({isSaving: false});
  }

  //  HTML to render for this component
  render() {

    //  If the extension is not configured, prevent clicking the button
    const settingsAreSet = (this.state.siteName && this.state.username && this.state.password) || !this.state.isSaving;
    let button = <Button kind="primary" key="saveButton" disabled >Save</Button>;
    if (settingsAreSet) {
      button = <Button kind="primary" key="saveButton" onClick={this.addUsersToTableau}>Save</Button>
    }

    //  Render the output
    return  <div>
              { button }
            </div>
  }
}