import React from "react";
import { Button, TextField, DropdownSelect, TextLink } from '@tableau/tableau-ui';
import './Config.css';
/* global tableau */

export class Config extends React.Component {

  constructor(props) {
    super(props);
    //  Set default config values 
    this.state = {
      tableauUrl: "https://us-west-2.online.tableau.com",
      apiVersion: "3.17",
      siteName: "",
      username: "",
      password: "",
      dataSheet: "",
      worksheets: [],
      settingsLoaded: false
    }
    //  Bind event handlers to `this`
    this.saveThenCloseDialog = this.saveThenCloseDialog.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
  }

  //  Save settings, then close
  saveThenCloseDialog() {
    //  Save a reference to this component
    let thisComponent = this;

    //  Persist the changes made to settings
    const settingsToSave = {
      "tableauUrl": this.state.tableauUrl,
      "apiVersion": this.state.apiVersion,
      "siteName": this.state.siteName,
      "username": this.state.username,
      "password": this.state.password,
      "dataSheet": this.state.dataSheet
    }
    tableau.extensions.settings.set(this.props.settingsKey, JSON.stringify(settingsToSave));
    tableau.extensions.settings.saveAsync().then((newSavedSettings) => {
      thisComponent.closeDialog()
    });
  }

  //  Trigger the popup to close
  closeDialog() {
    tableau.extensions.ui.closeDialog();
  }

  componentDidMount() {

    let thisComponent = this;

    //  Initialize the popup using tableau extension api
    tableau.extensions.initializeDialogAsync().then( () => {

      let newState = { settingsLoaded: true }

      //  Look for any saved settings
      const settingsString = tableau.extensions.settings.get(this.props.settingsKey);
      if (settingsString) {
        // Found saved settings, update the new state object
        const settings = JSON.parse(settingsString);
        console.log(settings)
        newState.tableauUrl = settings.tableauUrl;
        newState.apiVersion = settings.apiVersion;
        newState.siteName = settings.siteName;
        newState.username = settings.username;
        newState.password = settings.password;
        newState.dataSheet = settings.dataSheet;
      }
      
      //  Get a list of all worksheets on the dashboard
      let sheets = [];
      tableau.extensions.dashboardContent.dashboard.worksheets.forEach( sheet => {
        sheets.push(sheet.name);
      })
      newState.worksheets = sheets;

      //  Update the state
      thisComponent.setState(newState)

    })
  }

  //  HTML to render for this component
  render() {

    //  Get a reference to this component
    let thisComponent = this;

    //  Helper function to figure out which input was changed, and update the appropriate property of this component's state
    const updateStateDynamically = (e,isOnClear) => {
      const propName = e.target.attributes["stateprop"].value;
      let newStateValue = {}
      newStateValue[propName] = isOnClear ? "" : e.target.value;
      thisComponent.setState(newStateValue)
    }

    //  Define defaults for all inputs
    const textFieldProps = {
      kind: 'line',
      onChange: e => updateStateDynamically(e,false),
      onClear: e => updateStateDynamically(e,true),
      style: { width: 300 }
      //key: this.state.settingsLoaded ? 'ready' : 'loading' 
    };
    if (!this.state.settingsLoaded) {
      textFieldProps.readonly = true;
    }

    //  Create menu items for worksheets dropdown
    const items = this.state.worksheets.map( (sheetName, index) => {
      return <option value={sheetName} key={index} selected={sheetName===thisComponent.state.dataSheet}>{sheetName}</option> 
    })

    //  Render the output
    return (
      <div>
        <div className="tableau-titlebar">
          <span className="tableau-titlebar-label">Configure Extension</span>
          <span className="tableau-titlebar-close-button" onClick={this.closeDialog}>x</span>
        </div>
        <TextField label="Tableau URL" stateprop="tableauUrl" value={this.state.tableauUrl} {...textFieldProps}/>
        <br/>
        <TextField label="Site Name" stateprop="siteName" value={this.state.siteName} {...textFieldProps}/>
        <br/>
        <TextField label="API Version" stateprop="apiVersion" value={this.state.apiVersion} {...textFieldProps}/>
        <br/>
        <TextField label="Username" stateprop="username" value={this.state.username} {...textFieldProps}/>
        <br/>
        <TextField label="Password" stateprop="password" type="password" value={this.state.password} {...textFieldProps}/>
        <br/>
        <DropdownSelect label='Label' kind='line'
                        onChange={e => thisComponent.setState({ dataSheet: e.target.value })}>
           { items }
        </DropdownSelect>
        <br/>
        <div>
          <span>The selected sheet is required to have fields named "username", "fullName", "siteRole", & "authSetting".  More details on how these fields are used can be found in the</span>
          <TextLink kind='standalone' target='_blank' href='https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#add_user_to_site'>
            Tableau REST API Help
          </TextLink> 
        </div>
        <br/>
        <div className="tableau-footer">
          <Button kind="outline" key="cancelButton" onClick={this.closeDialog}>Cancel</Button>
          <Button kind="primary" key="saveButton" onClick={this.saveThenCloseDialog}>Save</Button>
        </div>
      </div>
    );
  }
}