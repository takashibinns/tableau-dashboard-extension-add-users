# Tableau Dashboard Extension: Add users to Tableau button
This project is for a Tableau Dashboard Extension, which displays a button within your dashboard.  Clicking the button will use Tableau's REST API to programmatically add a list of users to a site on Tableau Server or Tableau Cloud.
![Dashboard Extension](https://github.com/takashibinns/tableau-dashboard-extension-add-users/raw/main/screenshots/dashboard-extension.png)

## How to use it

Download the TREX file [here](https://raw.githubusercontent.com/takashibinns/tableau-dashboard-extension-add-users/main/tableau-dashboard-extension-add-user.trex) and [add it](https://help.tableau.com/current/pro/desktop/en-us/dashboard_extensions.htm) to your dashboard.  You will also need a sheet that contains the list of users you want to add.  There are several [required fields](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#add_user_to_site) when adding users, so make sure to include the following:

- **name**: This is the username, which will always be an email address for Tableau Cloud.  For Tableau Server, it depends on whether or not you have configured a local identity store or external (Active Directory).  If using a local identity store this can be any unique identifier for a user, but with Active Directory this must be a valid username from AD
- **fullName**: The display name for each user, usually first name + last name
- **siteRole**: Can be any of the following: Creator, Explorer, ExplorerCanPublish, SiteAdministratorExplorer, SiteAdministratorCreator, Unlicensed, or Viewer
- **authSetting**: Can be any of the following: ServerDefault, SAML, OpenID, or TableauIDWithMFA

Now that you have the data containing a list of users to add, open the extension's configuration popup.  Enter the authentication details for your Tableau environment

![Config Popup](https://github.com/takashibinns/tableau-dashboard-extension-add-users/raw/main/screenshots/config-popup.png)

- **Tableau URL**: This is the base url of your Tableau environment (ex. `https://us-west-2.online.tableau.com`).  Do not include a backslash at the end of this URL
- **Site Name**: The name of your Tableau site (can be found from your Tableau environmen's URL).  If using the default site on Tableau Server, just leave this blank
- **API Version**: The version of the REST API to use.  Tableau Cloud will always support the most recent version, but if using Tableau Server check out this [table](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_concepts_versions.htm#tableau-server-versions-and-rest-api-versions) to determine what version of the REST API to use
- **Username**: This must be an admin user, in order to have permissions to add users
- **Password**: Password for the admin user
- **Sheet**: Which sheet within your dashboard contains the list of users to add?
 
![Tableau URL screenshot](https://github.com/takashibinns/tableau-dashboard-extension-add-users/raw/main/screenshots/tableau-details.png)

Once you've added your configuration settings, click the Save button to close the popup.  Now, you should be able to click the blue Save button in your dashboard to add the users to Tableau.  If there is ever a problem adding users, this extension will add the ones it can and let you know about any errors for specific users.
